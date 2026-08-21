import { Schema } from 'effect'
import type { Order } from './sort'

export type CriteriaValue = string | number | ReadonlyArray<string | number> | undefined

export type Criteria = Readonly<Record<string, CriteriaValue>>

export type PretragaRequest<C extends Criteria, O extends string> = {
  readonly criteria: C
  readonly order_: ReadonlyArray<Order<O>>
  readonly limit_?: number
  readonly offset_?: number
  readonly lop_?: 'AND' | 'OR'
}

export type PretragaResponse<A> = {
  readonly total_: number
  readonly offset_: number
  readonly result: ReadonlyArray<A>
}

export const ioPretragaResponse = <A>(item: Schema.Schema<A>) =>
  Schema.Struct({
    total_: Schema.Number,
    offset_: Schema.Number,
    result: Schema.Array(item),
  })

const values = (value: Exclude<CriteriaValue, undefined>): ReadonlyArray<string | number> =>
  typeof value === 'string' || typeof value === 'number' ? [value] : value

export const toQuery = <C extends Criteria, O extends string>(request: PretragaRequest<C, O>): string => {
  const params = new URLSearchParams()

  if (request.limit_ !== undefined) params.append('limit_', String(request.limit_))
  if (request.offset_ !== undefined) params.append('offset_', String(request.offset_))
  if (request.lop_ !== undefined) params.append('lop_', request.lop_)

  for (const [attribute, value] of Object.entries(request.criteria)) {
    if (value === undefined) continue
    for (const one of values(value)) params.append(attribute, String(one))
  }

  for (const [attribute, direction] of request.order_) {
    params.append('order_', attribute)
    params.append('order_', direction)
  }

  return params.toString()
}

export const withQuery = <C extends Criteria, O extends string>(
  pathname: string,
  request: PretragaRequest<C, O>,
): string => {
  const query = toQuery(request)
  return query === '' ? pathname : `${pathname}?${query}`
}

const sameValue = (a: CriteriaValue, b: CriteriaValue): boolean =>
  Array.isArray(a) || Array.isArray(b)
    ? Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((one, i) => one === b[i])
    : a === b

const sameCriteria = (a: Criteria, b: Criteria): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) if (!sameValue(a[key], b[key])) return false
  return true
}

const sameOrder = <O extends string>(a: ReadonlyArray<Order<O>>, b: ReadonlyArray<Order<O>>): boolean =>
  a.length === b.length && a.every(([attribute, direction], i) => attribute === b[i]?.[0] && direction === b[i]?.[1])

export const sameRequest = <C extends Criteria, O extends string>(
  a: PretragaRequest<C, O>,
  b: PretragaRequest<C, O>,
): boolean =>
  a.limit_ === b.limit_ &&
  a.offset_ === b.offset_ &&
  a.lop_ === b.lop_ &&
  sameOrder(a.order_, b.order_) &&
  sameCriteria(a.criteria, b.criteria)
