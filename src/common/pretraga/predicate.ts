import { Schema } from 'effect'
import { fromYmd, toYmd } from '../domain/date/api'

const RANGE_SEPARATOR = '~'

export const predicateValue = <A>(predicate: readonly [string, A] | undefined): A | null =>
  predicate === undefined ? null : predicate[1]

export const ioStringOperator = Schema.Literal('eq', 'neq', 'contains', 'starts_with')
export type StringOperator = typeof ioStringOperator.Type
export const ioStringPredicate = Schema.Tuple(ioStringOperator, Schema.String)
export type StringPredicate = typeof ioStringPredicate.Type

export const contains = (value: string | null): StringPredicate | undefined =>
  value === null || value === '' ? undefined : ['contains', value]

export const ioEnumOperator = Schema.Literal('eq', 'neq')
export type EnumOperator = typeof ioEnumOperator.Type
export const ioEnumPredicate = <A>(value: Schema.Schema<A>) => Schema.Tuple(ioEnumOperator, value)
export type EnumPredicate<A> = readonly [EnumOperator, A]

export const eq = <A extends string>(value: A | null): EnumPredicate<A> | undefined =>
  value === null ? undefined : ['eq', value]

export const ioDateOperator = Schema.Literal('eq', 'before', 'after', 'before_or_same', 'after_or_same', 'between')
export type DateOperator = typeof ioDateOperator.Type
export const ioDatePredicate = Schema.Tuple(ioDateOperator, Schema.String)
export type DatePredicate = typeof ioDatePredicate.Type
export type DateRange = readonly [Date | null, Date | null]

const dan = (raw: string | undefined): Date | null => (raw === undefined ? null : fromYmd(raw))

const opseg = (od: Date | null, doDatuma: Date | null): DateRange | null =>
  od === null && doDatuma === null ? null : [od, doDatuma]

export const range = (value: DateRange | null): DatePredicate | undefined => {
  const [od, doDatuma] = value ?? [null, null]
  if (od !== null && doDatuma !== null) return ['between', `${toYmd(od)}${RANGE_SEPARATOR}${toYmd(doDatuma)}`]
  if (od !== null) return ['after_or_same', toYmd(od)]
  if (doDatuma !== null) return ['before_or_same', toYmd(doDatuma)]
  return undefined
}

export const rangeValue = (predicate: DatePredicate | undefined): DateRange | null => {
  if (predicate === undefined) return null
  const [operator, raw] = predicate
  if (operator === 'between') {
    const [od, doDatuma] = raw.split(RANGE_SEPARATOR)
    return opseg(dan(od), dan(doDatuma))
  }
  if (operator === 'after_or_same') return opseg(dan(raw), null)
  if (operator === 'before_or_same') return opseg(null, dan(raw))
  return null
}
