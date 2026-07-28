import { Duration, Effect } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import type { FieldDef } from './field'
import type { Async, Issue } from './types'

// -------------------------------------------------------------------------------------
// asyncValidated — wrap any field with debounced server-side validation
// -------------------------------------------------------------------------------------
//
// On each value change: mark Validating, wait `debounceMs`, then run `check(value)` as a
// Cmd. A per-field seq drops stale responses. The resulting issues surface through the
// field's `issues(state)` (merged by Form.object into the field's FieldUi).

export type AsyncConfig<Value, A> = {
  readonly check: (value: Value) => Http.Request<A>
  readonly toIssues: (response: A, value: Value) => ReadonlyArray<Issue>
  readonly debounceMs?: number
}

type State<S> = { readonly inner: S; readonly status: Async; readonly seq: number }

type Msg<M> =
  | { readonly _tag: 'Inner'; readonly msg: M }
  | { readonly _tag: 'Debounced'; readonly seq: number; readonly value: unknown }
  | { readonly _tag: 'Checked'; readonly seq: number; readonly issues: ReadonlyArray<Issue> }

const isEmpty = (v: unknown): boolean => v === '' || v == null || (Array.isArray(v) && v.length === 0)

export const asyncValidated = <Value, S, M, A>(
  field: FieldDef<Value, S, M>,
  cfg: AsyncConfig<Value, A>,
): FieldDef<Value, State<S>, Msg<M>> => {
  const inner = (msg: M): Msg<M> => ({ _tag: 'Inner', msg })

  return {
    schema: field.schema,
    empty: field.empty,
    required: field.required,
    dependsOn: field.dependsOn,

    init: v => {
      const [s, cmd] = field.init(v)
      return [{ inner: s, status: { _tag: 'Idle' }, seq: 0 }, Cmd.map(inner)(cmd)]
    },

    value: st => field.value(st.inner),
    set: (st, v) => ({ inner: field.set(st.inner, v), status: { _tag: 'Idle' }, seq: st.seq }),

    update: (msg, st, ctx) => {
      switch (msg._tag) {
        case 'Inner': {
          const [innerState, cmd] = field.update(msg.msg, st.inner, ctx)
          const innerCmd = Cmd.map(inner)(cmd)
          const base: State<S> = { ...st, inner: innerState }
          if (!field.changed(msg.msg)) return [base, innerCmd]

          const value = field.value(innerState)
          const seq = st.seq + 1
          if (isEmpty(value)) return [{ ...base, seq, status: { _tag: 'Idle' } }, innerCmd]

          const debounce = Cmd.fromEffect(
            Effect.sleep(Duration.millis(cfg.debounceMs ?? 400)).pipe(
              Effect.as<Msg<M>>({ _tag: 'Debounced', seq, value }),
            ),
          )
          return [{ ...base, seq, status: { _tag: 'Validating' } }, Cmd.batch([innerCmd, debounce])]
        }
        case 'Debounced':
          if (msg.seq !== st.seq) return [st, Cmd.none]
          return [
            st,
            Http.send(cfg.check(msg.value as Value), {
              onSuccess: (r): Msg<M> => ({
                _tag: 'Checked',
                seq: msg.seq,
                issues: cfg.toIssues(r, msg.value as Value),
              }),
              onError: (): Msg<M> => ({ _tag: 'Checked', seq: msg.seq, issues: [] }),
            }),
          ]
        case 'Checked':
          if (msg.seq !== st.seq) return [st, Cmd.none]
          return [{ ...st, status: { _tag: 'Done', issues: msg.issues } }, Cmd.none]
      }
    },

    changed: msg => msg._tag === 'Inner' && field.changed(msg.msg),
    issues: st => (st.status._tag === 'Done' ? st.status.issues : []),
    validating: st => st.status._tag === 'Validating',
    view: (st, ui) => Html.map(inner)(field.view(st.inner, ui)),
  }
}
