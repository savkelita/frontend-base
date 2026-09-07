import { Either, ParseResult, Schema } from 'effect'
import type * as Cmd from 'tea-effect/Cmd'
import type * as TeaReact from 'tea-effect/React'
import type { FieldCtx, FieldUi, Issue, SelectOption } from './types'

// -------------------------------------------------------------------------------------
// FieldDef — a field is a small TEA unit that yields an (encoded) Value
// -------------------------------------------------------------------------------------
//
// `Value` is the encoded/draft value (string, boolean, ...). `schema` decodes it to the
// `Decoded` domenski tip (onaj koji završi u payload-u) i nosi validaciju.
// Value polja imaju State = Value; async polja (combo) nose bogatiji State + Msg. Ovaj
// interfejs objedinjuje oba.
//
// `Decoded` je pravi tipski parametar, a ne `Schema.Schema<any, Value>`: on je razlog zašto
// je `Payload<F>` precizan, pa je mapiranje draft -> telo zahteva tipski provereno.

export interface FieldDef<Value, State, Msg, Decoded = any, Choice = unknown> {
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
   * Da li je ova poruka promenila vrednost polja? (okidač za zavisnosti i efekte)
   * `previous` je stanje na koje je poruka primenjena, pa value polje ume da razlikuje pravu
   * izmenu od pritiska tastera koji ponovo otkuca isti tekst.
   */
  changed(msg: Msg, previous: State): boolean
  view(state: State, ui: FieldUi): TeaReact.Html<Msg>
  /** Extra issues held in the field's state (e.g. async/server validation). */
  issues?(state: State): ReadonlyArray<Issue>
  /** Whether an async validation is in flight. */
  validating?(state: State): boolean
  /**
   * Izabrana opcija (ili više njih), za polje čija je vrednost izbor (combo, select).
   * Omogućava formi da izvede vrednost iz onoga što je korisnik izabrao, a ne samo iz id-a.
   */
  selected?(state: State): ReadonlyArray<SelectOption<Choice>>
  /**
   * Postavi vrednost celim opcijama umesto golim id-evima, da programsko popunjavanje sačuva
   * labele. Obična Set poruka nosi samo id, koji bi combo onda prikazao sirov.
   */
  setSelected?(state: State, options: ReadonlyArray<SelectOption<Choice>>): State
}

export type ValueOf<Fd> = Fd extends FieldDef<infer V, any, any, any, any> ? V : never
export type StateOf<Fd> = Fd extends FieldDef<any, infer S, any, any, any> ? S : never
export type MsgOf<Fd> = Fd extends FieldDef<any, any, infer M, any, any> ? M : never
export type DecodedOf<Fd> = Fd extends FieldDef<any, any, any, infer D, any> ? D : never
/** Tip reda iza polja sa izborom, da forma čita izabranu opciju bez kasta. */
export type ChoiceOf<Fd> = Fd extends FieldDef<any, any, any, any, infer C> ? C : never

// -------------------------------------------------------------------------------------
// Per-field validation (sync, from the field's schema)
// -------------------------------------------------------------------------------------

export const fieldIssues = (
  key: string,
  field: FieldDef<any, any, any, any, any>,
  value: unknown,
): ReadonlyArray<Issue> =>
  Either.match(Schema.decodeUnknownEither(field.schema, { errors: 'all' })(value), {
    onRight: () => [],
    onLeft: error =>
      ParseResult.ArrayFormatter.formatErrorSync(error).map(i => ({
        path: [key],
        message: i.message,
        severity: 'error' as const,
      })),
  })
