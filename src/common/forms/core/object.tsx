import { Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import type * as TeaReact from 'tea-effect/React'
import type { FieldDef, ValueOf, StateOf, MsgOf, DecodedOf } from './field'
import { fieldIssues } from './field'
import type { FieldUi, Issue, Mode } from './types'

// -------------------------------------------------------------------------------------
// Form.object — composes FieldDefs into a form state machine
// -------------------------------------------------------------------------------------
//
// The form owns field interaction (Field/Set), validation, dirty, and cross-field
// dependencies/effects. It does NOT own the save: the feature calls `trySubmit` and,
// on a valid payload, fires its own Http command (so the save result stays a feature Msg).

export type Fields = Record<string, FieldDef<any, any, any>>

export type Draft<F extends Fields> = { readonly [K in keyof F]: ValueOf<F[K]> }
export type Payload<F extends Fields> = { readonly [K in keyof F]: DecodedOf<F[K]> }

export type FormModel<F extends Fields> = {
  readonly states: { readonly [K in keyof F]: StateOf<F[K]> }
  readonly original: Draft<F>
  readonly touched: ReadonlySet<string>
  readonly submitAttempted: boolean
  readonly status: 'Editing' | 'Submitting'
  readonly mode: Mode
  readonly serverIssues: ReadonlyArray<Issue>
}

type FieldMsg<F extends Fields> = {
  [K in keyof F]: { readonly _tag: 'Field'; readonly key: K; readonly msg: MsgOf<F[K]> }
}[keyof F]

export type FormMsg<F extends Fields> =
  | FieldMsg<F>
  | { readonly _tag: 'Set'; readonly key: keyof F; readonly value: unknown }

export type FieldRule = { enabled: boolean; visible: boolean; readonly: boolean; required: boolean }

export type Config<F extends Fields> = {
  readonly effects?: ReadonlyArray<{ readonly when: keyof F; readonly run: (draft: Draft<F>) => Cmd.Cmd<FormMsg<F>> }>
  readonly rules?: (draft: Draft<F>, ctx: { readonly mode: Mode }) => Partial<Record<keyof F, Partial<FieldRule>>>
  readonly validate?: (draft: Draft<F>) => ReadonlyArray<Issue>
}

export interface FormSpec<F extends Fields> {
  create(): [FormModel<F>, Cmd.Cmd<FormMsg<F>>]
  edit(record: Draft<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>]
  copy(record: Draft<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>]
  view(record: Draft<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>]
  update(msg: FormMsg<F>, model: FormModel<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>]
  /** Validate + decode. `Some(payload)` only when valid; marks the form as submitting. */
  trySubmit(model: FormModel<F>): [FormModel<F>, Option.Option<Payload<F>>]
  toEditing(model: FormModel<F>): FormModel<F>
  withServerIssues(model: FormModel<F>, issues: ReadonlyArray<Issue>): FormModel<F>
  fieldUi(model: FormModel<F>, key: keyof F): FieldUi
  render(model: FormModel<F>, key: keyof F): TeaReact.Html<FormMsg<F>>
  isDirty(model: FormModel<F>): boolean
  isValid(model: FormModel<F>): boolean
  validate(model: FormModel<F>): ReadonlyArray<Issue>
}

const isEmpty = (v: unknown): boolean => v === '' || v == null

const addKey = (set: ReadonlySet<string>, key: string): ReadonlySet<string> => new Set(set).add(key)
const removeKey = (set: ReadonlySet<string>, key: string): ReadonlySet<string> => {
  const next = new Set(set)
  next.delete(key)
  return next
}

export const object = <F extends Fields>(fields: F, config: Config<F> = {}): FormSpec<F> => {
  const keys = Object.keys(fields) as Array<keyof F>
  const at = (o: object, k: PropertyKey): unknown => (o as Record<PropertyKey, unknown>)[k]

  // dependency graph (parent -> children) + transitive closure, built once
  const graph: Record<string, string[]> = {}
  for (const child of keys)
    for (const parent of fields[child].dependsOn ?? []) (graph[parent] ??= []).push(child as string)

  const descendants = (startKey: keyof F): string[] => {
    const out: string[] = []
    const stack = [...(graph[startKey as string] ?? [])]
    while (stack.length) {
      const n = stack.pop()!
      if (out.includes(n)) continue
      out.push(n)
      stack.push(...(graph[n] ?? []))
    }
    return out
  }

  const draftOf = (model: FormModel<F>): Draft<F> => {
    const d: Record<string, unknown> = {}
    for (const k of keys) d[k as string] = fields[k].value(model.states[k])
    return d as Draft<F>
  }

  const emptyDraft = (): Draft<F> => {
    const d: Record<string, unknown> = {}
    for (const k of keys) d[k as string] = fields[k].empty
    return d as Draft<F>
  }

  const wrap =
    (key: keyof F) =>
    (msg: unknown): FormMsg<F> =>
      ({ _tag: 'Field', key, msg }) as FormMsg<F>

  const allIssues = (model: FormModel<F>): ReadonlyArray<Issue> => {
    const draft = draftOf(model)
    const fromFields = keys.flatMap(k => [
      ...fieldIssues(k as string, fields[k], at(draft, k)),
      ...(fields[k].issues?.(model.states[k]) ?? []),
    ])
    return [...fromFields, ...(config.validate?.(draft) ?? []), ...model.serverIssues]
  }

  const computeFieldUi = (model: FormModel<F>, key: keyof F): FieldUi => {
    const draft = draftOf(model)
    const field = fields[key]
    const depsOk = (field.dependsOn ?? []).every(d => !isEmpty(at(draft, d)))
    const rule = config.rules?.(draft, { mode: model.mode })?.[key] ?? {}
    const enabled = model.mode !== 'View' && model.status !== 'Submitting' && (rule.enabled ?? true) && depsOk
    const readonly = model.mode === 'View' || (rule.readonly ?? false)
    const touched = model.touched.has(key as string) || model.submitAttempted
    const dirty = at(draft, key) !== at(model.original, key)
    const validating = field.validating?.(model.states[key]) ?? false
    const issues = touched
      ? [
          ...fieldIssues(key as string, field, at(draft, key)),
          ...(field.issues?.(model.states[key]) ?? []),
          ...model.serverIssues.filter(i => i.path[0] === key),
        ]
      : []
    return { required: rule.required ?? field.required, enabled, readonly, touched, dirty, validating, issues }
  }

  const resetField = (model: FormModel<F>, key: string): FormModel<F> => ({
    ...model,
    states: { ...model.states, [key]: fields[key].set(model.states[key as keyof F], fields[key].empty) },
    touched: removeKey(model.touched, key),
    serverIssues: model.serverIssues.filter(i => i.path[0] !== key),
  })

  const start = (mode: Mode, record: Draft<F>, baseline: Draft<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>] => {
    const states: Record<string, unknown> = {}
    const cmds: Array<Cmd.Cmd<FormMsg<F>>> = []
    for (const k of keys) {
      const [s, cmd] = fields[k].init(at(record, k) as never)
      states[k as string] = s
      cmds.push(Cmd.map(wrap(k))(cmd))
    }
    return [
      {
        states: states as FormModel<F>['states'],
        original: baseline,
        touched: new Set(),
        submitAttempted: false,
        status: 'Editing',
        mode,
        serverIssues: [],
      },
      Cmd.batch(cmds),
    ]
  }

  const updateField = (key: keyof F, msg: unknown, model: FormModel<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>] => {
    const field = fields[key]
    const deps: Record<string, unknown> = {}
    const draft0 = draftOf(model)
    for (const d of field.dependsOn ?? []) deps[d] = at(draft0, d)

    const [state, cmd] = field.update(msg, model.states[key], { deps, mode: model.mode })
    let next: FormModel<F> = {
      ...model,
      states: { ...model.states, [key]: state },
      touched: addKey(model.touched, key as string),
    }
    const fieldCmd = Cmd.map(wrap(key))(cmd)

    if (!field.changed(msg)) return [next, fieldCmd]

    for (const child of descendants(key)) next = resetField(next, child)
    const draft = draftOf(next)
    const effectCmds = (config.effects ?? []).filter(e => e.when === key).map(e => e.run(draft))
    return [next, Cmd.batch([fieldCmd, ...effectCmds])]
  }

  const trySubmit = (model: FormModel<F>): [FormModel<F>, Option.Option<Payload<F>>] => {
    if (allIssues(model).some(i => i.severity === 'error')) return [{ ...model, submitAttempted: true }, Option.none()]
    const draft = draftOf(model)
    const payload: Record<string, unknown> = {}
    for (const k of keys) payload[k as string] = Schema.decodeUnknownSync(fields[k].schema)(at(draft, k))
    return [{ ...model, status: 'Submitting', submitAttempted: true }, Option.some(payload as Payload<F>)]
  }

  return {
    create: () => start('Create', emptyDraft(), emptyDraft()),
    edit: record => start('Edit', record, record),
    copy: record => start('Copy', record, emptyDraft()),
    view: record => start('View', record, record),

    update: (msg, model) => {
      switch (msg._tag) {
        case 'Field':
          return updateField(msg.key, msg.msg, model)
        case 'Set':
          return [
            {
              ...model,
              states: { ...model.states, [msg.key]: fields[msg.key].set(model.states[msg.key], msg.value as never) },
              touched: addKey(model.touched, msg.key as string),
            },
            Cmd.none,
          ]
      }
    },

    trySubmit,
    toEditing: model => ({ ...model, status: 'Editing' }),
    withServerIssues: (model, issues) => ({ ...model, status: 'Editing', serverIssues: issues }),

    fieldUi: computeFieldUi,
    render: (model, key) => Html.map(wrap(key))(fields[key].view(model.states[key], computeFieldUi(model, key))),
    isDirty: model => {
      const draft = draftOf(model)
      return keys.some(k => at(draft, k) !== at(model.original, k))
    },
    isValid: model => allIssues(model).every(i => i.severity !== 'error'),
    validate: allIssues,
  }
}
