import { Either, Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import type * as TeaReact from 'tea-effect/React'
import type { FieldDef, ValueOf, StateOf, MsgOf, DecodedOf, ChoiceOf } from './field'
import { fieldIssues } from './field'
import type { FieldUi, Issue, Mode, SelectOption } from './types'
import { sameValue } from './types'

// -------------------------------------------------------------------------------------
// Form.object — composes FieldDefs into a form state machine
// -------------------------------------------------------------------------------------
//
// The form owns field interaction (Field/Set), validation, dirty, and cross-field
// dependencies/effects. It does NOT own the save: the feature calls `trySubmit` and,
// on a valid payload, fires its own Http command (so the save result stays a feature Msg).

export type Fields = Record<string, FieldDef<any, any, any, any, any>>

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
  // Popuni polje sa izborom celim opcijama, da labela preživi (vidi FieldDef.setSelected).
  | { readonly _tag: 'SetOption'; readonly key: keyof F; readonly options: ReadonlyArray<SelectOption> }

export type FieldRule = { enabled: boolean; visible: boolean; readonly: boolean; required: boolean }

/**
 * Šta efekat može da pročita pored drafta: draft drži id-eve, ovo drži redove iz kojih su ti
 * id-evi izabrani — dovoljno da se vrednost izvede iz izabrane opcije.
 */
export type FormCtx<F extends Fields> = {
  readonly selected: <K extends keyof F>(key: K) => ReadonlyArray<SelectOption<ChoiceOf<F[K]>>>
  /** Jedan izabrani red, za uobičajen slučaj comboa sa jednim izborom. */
  readonly chosen: <K extends keyof F>(key: K) => ChoiceOf<F[K]> | undefined
}

export type Config<F extends Fields> = {
  /**
   * Vrednosti koje su funkcija drugih vrednosti, izrečene jednom kao invarijanta umesto da se
   * računaju sa svakog mesta koje ih može poremetiti. Izvršava se sinhrono posle svake promene
   * (Field, Set, SetOption) i upisuje ono što vrati.
   *
   * Namerno se NE izvršava pri kreiranju ili učitavanju forme: u tom trenutku combo zna svoj
   * id ali još ne i red iza njega, pa bi izvođenje obrisalo vrednost koju zapis već ima.
   */
  readonly derive?: (draft: Draft<F>, ctx: FormCtx<F>) => Partial<Draft<F>>
  readonly effects?: ReadonlyArray<{
    readonly when: keyof F
    readonly run: (draft: Draft<F>, ctx: FormCtx<F>) => Cmd.Cmd<FormMsg<F>>
  }>
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
  /** Izabrana opcija u polju sa izborom — red iza vrednosti, a ne samo njen id. */
  selected<K extends keyof F>(model: FormModel<F>, key: K): ReadonlyArray<SelectOption<ChoiceOf<F[K]>>>
  /**
   * Upiši više polja odjednom, sinhrono — bez odlaska kroz poruku. Za trenutke kada feature
   * mora sam da prepiše deo forme (brisanje onoga o čemu odlučuje promenjeni roditelj).
   * Izvedene vrednosti se preračunavaju posle toga.
   */
  setValues(model: FormModel<F>, values: Partial<Draft<F>>): FormModel<F>
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

  const ruleFor = (draft: Draft<F>, mode: Mode, key: keyof F): Partial<FieldRule> =>
    config.rules?.(draft, { mode })?.[key] ?? {}

  // Polje koje korisnik ne može da menja ne sme da blokira formu: zatečeni podatak koji više
  // ne zadovoljava šemu (enum vrednost povučena posle nastanka zapisa) inače pada na validaciji
  // polja koje je onemogućeno, pa korisnik ostaje bez izlaza.
  const isReadonly = (draft: Draft<F>, mode: Mode, key: keyof F): boolean =>
    mode === 'View' || (ruleFor(draft, mode, key).readonly ?? false)

  const allIssues = (model: FormModel<F>): ReadonlyArray<Issue> => {
    const draft = draftOf(model)
    const fromFields = keys.flatMap(k =>
      isReadonly(draft, model.mode, k)
        ? []
        : [...fieldIssues(k as string, fields[k], at(draft, k)), ...(fields[k].issues?.(model.states[k]) ?? [])],
    )
    return [...fromFields, ...(config.validate?.(draft) ?? []), ...model.serverIssues]
  }

  const computeFieldUi = (model: FormModel<F>, key: keyof F): FieldUi => {
    const draft = draftOf(model)
    const field = fields[key]
    const depsOk = (field.dependsOn ?? []).every(d => !isEmpty(at(draft, d)))
    const rule = ruleFor(draft, model.mode, key)
    const enabled = model.mode !== 'View' && model.status !== 'Submitting' && (rule.enabled ?? true) && depsOk
    const readonly = model.mode === 'View' || (rule.readonly ?? false)
    const touched = model.touched.has(key as string) || model.submitAttempted
    const dirty = !sameValue(at(draft, key), at(model.original, key))
    const validating = field.validating?.(model.states[key]) ?? false
    // Readonly polja se ne validiraju (vidi isReadonly), pa ni greške ne prikazuju.
    const issues =
      touched && !readonly
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

    // I poruka koja nije pomerila vrednost može nešto da donese (razrešena labela comboa nosi
    // i red uz sebe), pa se invarijante obnavljaju u oba slučaja.
    if (!field.changed(msg, model.states[key])) return [applyDerive(next), fieldCmd]

    for (const child of descendants(key)) next = resetField(next, child)
    next = applyDerive(next)
    const effectCmds = (config.effects ?? []).filter(e => e.when === key).map(e => e.run(draftOf(next), ctxOf(next)))
    return [next, Cmd.batch([fieldCmd, ...effectCmds])]
  }

  const chosenOptions = <K extends keyof F>(model: FormModel<F>, key: K) =>
    (fields[key].selected?.(model.states[key]) ?? []) as ReadonlyArray<SelectOption<ChoiceOf<F[K]>>>

  const ctxOf = (model: FormModel<F>): FormCtx<F> => ({
    selected: key => chosenOptions(model, key),
    chosen: key => chosenOptions(model, key)[0]?.data,
  })

  // Upisuje vrednosti pravo u stanja polja. Bez poruka, bez touched: ovo forma prepravlja
  // samu sebe, nije korisnik taj koji menja.
  const writeValues = (model: FormModel<F>, values: Partial<Draft<F>>): FormModel<F> => {
    const entries = (Object.keys(values) as Array<keyof F>).filter(k => at(values, k) !== undefined)
    if (entries.length === 0) return model
    const states: Record<string, unknown> = { ...model.states }
    for (const k of entries) states[k as string] = fields[k].set(model.states[k], at(values, k) as never)
    return { ...model, states: states as FormModel<F>['states'] }
  }

  // Obnavlja invarijante posle svake promene. Izvedena polja su forma koja govori sama sebi,
  // pa vrednost koju upiše nikada ne računamo kao dodirnutu.
  const applyDerive = (model: FormModel<F>): FormModel<F> =>
    config.derive ? writeValues(model, config.derive(draftOf(model), ctxOf(model))) : model

  // Polje koje razume opcije zadržava njihove labele; sve ostalo pada na gole vrednosti, a to
  // je i jedino što polje bez izbora ume da drži.
  const setSelected = (key: keyof F, options: ReadonlyArray<SelectOption>, state: StateOf<F[keyof F]>) => {
    const field = fields[key]
    if (field.setSelected) return field.setSelected(state, options)
    const values = options.map(o => o.value)
    return field.set(state, (Array.isArray(field.empty) ? values : (values[0] ?? field.empty)) as never)
  }

  const trySubmit = (model: FormModel<F>): [FormModel<F>, Option.Option<Payload<F>>] => {
    if (allIssues(model).some(i => i.severity === 'error')) return [{ ...model, submitAttempted: true }, Option.none()]
    const draft = draftOf(model)
    const payload: Record<string, unknown> = {}
    for (const k of keys) {
      const raw = at(draft, k)
      // Validirana polja se uvek dekoduju (allIssues je to upravo dokazao). Readonly polje se
      // ne validira, pa vrednost koju šema odbija prolazi onakva kakva je sačuvana umesto da
      // se odbaci — građenje payload-a ne sme da pukne.
      payload[k as string] = Either.getOrElse(Schema.decodeUnknownEither(fields[k].schema)(raw), () => raw)
    }
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
            applyDerive({
              ...model,
              states: { ...model.states, [msg.key]: fields[msg.key].set(model.states[msg.key], msg.value as never) },
              touched: addKey(model.touched, msg.key as string),
            }),
            Cmd.none,
          ]
        case 'SetOption':
          return [
            applyDerive({
              ...model,
              states: { ...model.states, [msg.key]: setSelected(msg.key, msg.options, model.states[msg.key]) },
              touched: addKey(model.touched, msg.key as string),
            }),
            Cmd.none,
          ]
      }
    },

    trySubmit,
    toEditing: model => ({ ...model, status: 'Editing' }),
    selected: chosenOptions,
    setValues: (model, values) => applyDerive(writeValues(model, values)),
    withServerIssues: (model, issues) => ({ ...model, status: 'Editing', serverIssues: issues }),

    fieldUi: computeFieldUi,
    render: (model, key) => Html.map(wrap(key))(fields[key].view(model.states[key], computeFieldUi(model, key))),
    isDirty: model => {
      const draft = draftOf(model)
      return keys.some(k => !sameValue(at(draft, k), at(model.original, k)))
    },
    isValid: model => allIssues(model).every(i => i.severity !== 'error'),
    validate: allIssues,
  }
}
