import { Schema, SchemaTransformation } from 'effect'
import { fromYmd, toYmd } from '../domain/date/api'
import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
  isRange,
  type EnumOperator,
  type NumberOperator,
  type StringOperator,
} from './operator'

export const RANGE_SEPARATOR = '~'

export const predicateValue = <A>(predicate: readonly [string, ...Array<A>] | undefined): A | null =>
  predicate === undefined ? null : (predicate[1] ?? null)

export const ioId = Schema.String.check(Schema.isPattern(/\S/)).pipe(
  Schema.decodeTo(Schema.Int, SchemaTransformation.numberFromString),
)

export const ioBoolean = Schema.Literals(['true', 'false']).pipe(
  Schema.decodeTo(
    Schema.Boolean,
    SchemaTransformation.transform({ decode: text => text === 'true', encode: value => (value ? 'true' : 'false') }),
  ),
)

export const ioStringOperator = Schema.Literals(STRING_OPERATORS)

export const ioStringPredicateOf = (operators: ReadonlyArray<StringOperator> = STRING_OPERATORS) =>
  Schema.Tuple([Schema.Literals(operators), Schema.String])

export const ioStringPredicate = ioStringPredicateOf()
export type StringPredicate = typeof ioStringPredicate.Type

export const contains = (value: string | null): StringPredicate | undefined =>
  value === null || value === '' ? undefined : ['contains', value]

export const ioEnumOperator = Schema.Literals(ENUM_OPERATORS)

export const ioEnumPredicateOf = <A>(value: Schema.Codec<A>, operators: ReadonlyArray<EnumOperator> = ENUM_OPERATORS) =>
  Schema.TupleWithRest(Schema.Tuple([Schema.Literals(operators)]), [value])

export const ioEnumPredicate = <A>(value: Schema.Codec<A>) => ioEnumPredicateOf(value)
export type EnumPredicate<A> = readonly [EnumOperator, ...Array<A>]

export const eq = <A extends string>(value: A | null): readonly ['eq', A] | undefined =>
  value === null ? undefined : ['eq', value]

export const ioNumberOperator = Schema.Literals(NUMBER_OPERATORS)

export const isNumberText = (raw: string): boolean => /^-?\d+(\.\d+)?$/.test(raw)

const isBoundsText = (raw: string): boolean => {
  const [from, to, ...rest] = raw.split(RANGE_SEPARATOR)
  return rest.length === 0 && from !== undefined && to !== undefined && isNumberText(from) && isNumberText(to)
}

export const ioNumberPredicateOf = (operators: ReadonlyArray<NumberOperator> = NUMBER_OPERATORS) =>
  Schema.Tuple([Schema.Literals(operators), Schema.String]).pipe(
    Schema.check(
      Schema.makeFilter(([operator, raw]: readonly [NumberOperator, string]) =>
        isRange(operator) ? isBoundsText(raw) : isNumberText(raw),
      ),
    ),
  )

export const ioNumberPredicate = ioNumberPredicateOf()
export type NumberPredicate = typeof ioNumberPredicate.Type

export const ioDateOperator = Schema.Literals(DATE_OPERATORS)
export const ioDatePredicate = Schema.Tuple([ioDateOperator, Schema.String])
export type DatePredicate = typeof ioDatePredicate.Type
export type DateRange = readonly [Date | null, Date | null]

const day = (raw: string | undefined): Date | null => (raw === undefined ? null : fromYmd(raw))

const bounds = (from: Date | null, to: Date | null): DateRange | null =>
  from === null && to === null ? null : [from, to]

export const range = (value: DateRange | null): DatePredicate | undefined => {
  const [from, to] = value ?? [null, null]
  if (from !== null && to !== null) return ['between', `${toYmd(from)}${RANGE_SEPARATOR}${toYmd(to)}`]
  if (from !== null) return ['after_or_same', toYmd(from)]
  if (to !== null) return ['before_or_same', toYmd(to)]
  return undefined
}

export const rangeValue = (predicate: DatePredicate | undefined): DateRange | null => {
  if (predicate === undefined) return null
  const [operator, raw] = predicate
  if (operator === 'between') {
    const [from, to] = raw.split(RANGE_SEPARATOR)
    return bounds(day(from), day(to))
  }
  if (operator === 'after_or_same') return bounds(day(raw), null)
  if (operator === 'before_or_same') return bounds(null, day(raw))
  return null
}
