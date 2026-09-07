import * as S from 'effect/Schema'
import * as Http from 'tea-effect/Http'
import type { SelectOption } from '../forms/widgets'

// -------------------------------------------------------------------------------------
// Pretraga (search) contract
// -------------------------------------------------------------------------------------
//
// The standard backend search protocol used across the app. Each module's `api` declares
// its own Criteria/Result types and the concrete route (see products/api); this module
// holds only the shared machinery.
//
//   PretragaRequest<Criteria, Order>  (query params)
//     limit_?    Int        (omit for "return all")
//     offset_?   Int        (-1 for last page)
//     lop_?      and | or   (default: and)
//     ...criteria           (e.g. unetaVrednost=contains&unetaVrednost=<text>)
//     ...order              (order_=<attr>&order_=ASC|DESC)
//
//   PretragaResponse<Result>
//     { total_: number; offset_: number | null; result: Result[] }

/** A criterion value: a scalar, or a tuple that flattens to repeated params. */
export type Predicate = string | number | readonly (string | number)[]

export type PretragaRequest<Criteria extends Record<string, Predicate | undefined>> = {
  readonly limit_?: number
  readonly offset_?: number
  readonly lop_?: 'and' | 'or'
  readonly criteria: Criteria
  readonly order_?: ReadonlyArray<readonly [attribute: string, direction: 'ASC' | 'DESC']>
}

export type PretragaResponse<Result> = {
  readonly total_: number
  readonly offset_: number | null
  readonly result: ReadonlyArray<Result>
}

/** Criteria shared by every combo (id + the type-ahead text); specific combos extend it. */
export type BaseComboCriteria = {
  readonly id?: number
  readonly unetaVrednost?: readonly ['contains', string]
}

/** `['contains', text]` — the standard type-ahead criterion. */
export const contains = (text: string): readonly ['contains', string] => ['contains', text]

/** Builds the query string for a PretragaRequest (repeats keys for tuple values). */
export const toQuery = <C extends Record<string, Predicate | undefined>>({
  limit_,
  offset_,
  lop_,
  criteria,
  order_,
}: PretragaRequest<C>): string => {
  const params = new URLSearchParams()
  if (limit_ != null) params.set('limit_', String(limit_))
  if (offset_ != null) params.set('offset_', String(offset_))
  if (lop_) params.set('lop_', lop_)
  for (const [key, value] of Object.entries(criteria)) {
    if (value == null) continue
    if (Array.isArray(value)) value.forEach(v => params.append(key, String(v)))
    else params.append(key, String(value))
  }
  for (const [attribute, direction] of order_ ?? []) {
    params.append('order_', attribute)
    params.append('order_', direction)
  }
  return params.toString()
}

/** `PretragaResponse<Result>` schema for a given result-item schema. */
export const response = <A>(result: S.Schema<A>) =>
  S.Struct({
    total_: S.Number,
    offset_: S.NullOr(S.Number),
    result: S.Array(result),
  })

/**
 * Build a combo search request: `GET url?limit_&offset_&<criteria>`, decoding a
 * `PretragaResponse<Result>`. Extracts the paging + decode boilerplate every combo route
 * repeats. Combos default to `limit_ = 10, offset_ = 0` (first page). `offset_` is a row
 * offset, so page 2 is `offset_ = 10`, page 3 `offset_ = 20`, … ("load more").
 */
export const comboRequest = <Result>(
  url: string,
  result: S.Schema<Result>,
  criteria: Record<string, Predicate | undefined>,
  paging: { readonly limit?: number; readonly offset?: number } = {},
): Http.Request<PretragaResponse<Result>> => {
  const { limit = 10, offset = 0 } = paging
  return Http.get(`${url}?${toQuery({ limit_: limit, offset_: offset, criteria })}`, Http.expectJson(response(result)))
}

// -------------------------------------------------------------------------------------
// Combo source
// -------------------------------------------------------------------------------------
//
// What `Form.combo` consumes. Defined next to a route via `pretragaCombo`, so the form
// only names the source (and, for cascades, how a parent value maps to a criterion) —
// the `unetaVrednost` criterion and result->option mapping live here, not in the form.

// `Result` je red koji pretraga vraća. Putuje uz svaku opciju, i forma ga kroz taj tip čita
// nazad — što je ono što izvedenu vrednost drži bez kastova.
export type ComboSource<Result = unknown> = {
  /** `offset` is a row offset for paging (0, then 10, 20, … as pages are loaded). */
  readonly request: (extra: Record<string, unknown>, query: string, offset: number) => Http.Request<any>
  readonly toOptions: (response: any) => ReadonlyArray<SelectOption<Result>>
  /** How many rows match in total (drives the "load more" affordance while more remain). */
  readonly total?: (response: any) => number
}

/** The standard combo result shape; such results map to options automatically. */
export type ComboItem = { readonly id: string | number; readonly sifra?: string | null; readonly naziv: string }

// Standard label: `sifra - naziv`, or just `naziv` when there is no sifra.
const defaultToOption = (item: ComboItem): SelectOption => ({
  value: String(item.id),
  label: item.sifra ? `${item.sifra} - ${item.naziv}` : item.naziv,
})

// `toOption` is optional for the standard `{ id, naziv }` result (mapped automatically);
// pass it only when the label is built differently (e.g. `ime + prezime`).
export function pretragaCombo<Result extends ComboItem, C extends BaseComboCriteria>(
  route: (criteria: C, offset?: number) => Http.Request<PretragaResponse<Result>>,
  toOption?: (item: Result) => SelectOption,
): ComboSource<Result>
export function pretragaCombo<Result, C extends BaseComboCriteria>(
  route: (criteria: C, offset?: number) => Http.Request<PretragaResponse<Result>>,
  toOption: (item: Result) => SelectOption,
): ComboSource<Result>
export function pretragaCombo<Result, C extends BaseComboCriteria>(
  route: (criteria: C, offset?: number) => Http.Request<PretragaResponse<Result>>,
  toOption?: (item: Result) => SelectOption,
): ComboSource<Result> {
  const map = toOption ?? (defaultToOption as (item: Result) => SelectOption)
  // Svaka opcija nosi red iz koga je nastala, pa forma može da pročita ostale atribute
  // izabranog reda (faktor konverzije, jedinicu mere) bez drugog zahteva.
  const toOption_ = (item: Result): SelectOption<Result> => ({ ...map(item), data: item })
  return {
    request: (extra, query, offset) => route({ ...extra, unetaVrednost: contains(query) } as C, offset),
    toOptions: response => (response as PretragaResponse<Result>).result.map(toOption_),
    total: response => (response as PretragaResponse<Result>).total_,
  }
}
