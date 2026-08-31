import { Either, ParseResult, Schema } from 'effect'
import type * as Cmd from 'tea-effect/Cmd'
import type * as TeaReact from 'tea-effect/React'
import type { FieldCtx, FieldUi, Issue } from './types'

// -------------------------------------------------------------------------------------
// FieldDef — a field is a small TEA unit that yields an (encoded) Value
// -------------------------------------------------------------------------------------
//
// `Value` is the encoded/draft value (string, boolean, ...). `schema` decodes it to the
// `Decoded` domain type (the one that ends up in the payload) and provides validation.
// Value fields have State = Value; async fields (combo) carry a rich State + Msg. This
// unifies both under one interface.
//
// `Decoded` is a real type parameter, not `Schema.Schema<any, Value>`: it is what makes
// `Payload<F>` precise, so a feature's draft -> request-body mapper is type-checked.

export interface FieldDef<Value, State, Msg, Decoded = any> {
  readonly schema: Schema.Schema<Decoded, Value>
  readonly empty: Value
  readonly required: boolean
  /** Parent field keys whose values feed this field (criteria + reset + auto-disable). */
  readonly dependsOn?: ReadonlyArray<string>
  init(value: Value): [State, Cmd.Cmd<Msg>]
  value(state: State): Value
  set(state: State, value: Value): State
  update(msg: Msg, state: State, ctx: FieldCtx): [State, Cmd.Cmd<Msg>]
  /**
   * Did this message change the field's value? (dependency/effect trigger)
   * `previous` is the state the message was applied to, so a value field can tell a real
   * edit from a keystroke that retypes the same text.
   */
  changed(msg: Msg, previous: State): boolean
  view(state: State, ui: FieldUi): TeaReact.Html<Msg>
  /** Extra issues held in the field's state (e.g. async/server validation). */
  issues?(state: State): ReadonlyArray<Issue>
  /** Whether an async validation is in flight. */
  validating?(state: State): boolean
}

export type ValueOf<Fd> = Fd extends FieldDef<infer V, any, any, any> ? V : never
export type StateOf<Fd> = Fd extends FieldDef<any, infer S, any, any> ? S : never
export type MsgOf<Fd> = Fd extends FieldDef<any, any, infer M, any> ? M : never
export type DecodedOf<Fd> = Fd extends FieldDef<any, any, any, infer D> ? D : never

// -------------------------------------------------------------------------------------
// Per-field validation (sync, from the field's schema)
// -------------------------------------------------------------------------------------

export const fieldIssues = (key: string, field: FieldDef<any, any, any, any>, value: unknown): ReadonlyArray<Issue> =>
  Either.match(Schema.decodeUnknownEither(field.schema, { errors: 'all' })(value), {
    onRight: () => [],
    onLeft: error =>
      ParseResult.ArrayFormatter.formatErrorSync(error).map(i => ({
        path: [key],
        message: i.message,
        severity: 'error' as const,
      })),
  })
