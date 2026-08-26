import { Schema } from 'effect'
import { fromYmd, toYmd } from '../domain/date/api'

export const ioStringOperator = Schema.Literal('eq', 'neq', 'contains', 'starts_with')

export type StringOperator = typeof ioStringOperator.Type

export const ioStringPredicate = Schema.Tuple(ioStringOperator, Schema.String)

export type StringPredicate = typeof ioStringPredicate.Type

export const ioEnumOperator = Schema.Literal('eq', 'neq')

export type EnumOperator = typeof ioEnumOperator.Type

export type EnumPredicate<A> = readonly [EnumOperator, A]

export const ioEnumPredicate = <A>(value: Schema.Schema<A>) => Schema.Tuple(ioEnumOperator, value)

export const ioDateOperator = Schema.Literal('eq', 'before', 'after', 'before_or_same', 'after_or_same', 'between')

export type DateOperator = typeof ioDateOperator.Type

export const ioDatePredicate = Schema.Tuple(ioDateOperator, Schema.String)

export type DatePredicate = typeof ioDatePredicate.Type

export type DateRange = readonly [Date | null, Date | null]

const RANGE_SEPARATOR = '~'

export const contains = (value: string | null): StringPredicate | undefined =>
  value === null || value === '' ? undefined : ['contains', value]

export const eq = <A extends string>(value: A | null): EnumPredicate<A> | undefined =>
  value === null ? undefined : ['eq', value]

/**
 * Operator bira popunjenost: oba datuma daju `between`, jedan kraj daje granicu koja taj
 * dan ukljucuje. Zato pola opsega jeste pretraga i polje nema sta da trazi od korisnika.
 */
export const range = (value: DateRange | null): DatePredicate | undefined => {
  if (value === null) return undefined
  const [od, doDatuma] = value
  if (od !== null && doDatuma !== null) return ['between', `${toYmd(od)}${RANGE_SEPARATOR}${toYmd(doDatuma)}`]
  if (od !== null) return ['after_or_same', toYmd(od)]
  if (doDatuma !== null) return ['before_or_same', toYmd(doDatuma)]
  return undefined
}

export const predicateValue = <A>(predicate: readonly [string, A] | undefined): A | null =>
  predicate === undefined ? null : predicate[1]

/** Cita nazad samo ono sto `range` ume i da napise; strogo `before`, `after` i `eq` polje ne prikazuje. */
export const rangeValue = (predicate: DatePredicate | undefined): DateRange | null => {
  if (predicate === undefined) return null
  const [operator, raw] = predicate
  if (operator === 'between') {
    const [od, doDatuma] = raw.split(RANGE_SEPARATOR)
    const value: DateRange = [od === undefined ? null : fromYmd(od), doDatuma === undefined ? null : fromYmd(doDatuma)]
    return value[0] === null && value[1] === null ? null : value
  }
  const date = fromYmd(raw)
  if (date === null) return null
  if (operator === 'after_or_same') return [date, null]
  if (operator === 'before_or_same') return [null, date]
  return null
}
