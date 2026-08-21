import { Schema } from 'effect'

export const ioStringOperator = Schema.Literal('eq', 'neq', 'contains', 'starts_with')

export type StringOperator = typeof ioStringOperator.Type

export const ioStringPredicate = Schema.Tuple(ioStringOperator, Schema.String)

export type StringPredicate = typeof ioStringPredicate.Type

export const ioEnumOperator = Schema.Literal('eq', 'neq')

export type EnumOperator = typeof ioEnumOperator.Type

export type EnumPredicate<A> = readonly [EnumOperator, A]

export const ioEnumPredicate = <A>(value: Schema.Schema<A>) => Schema.Tuple(ioEnumOperator, value)

export const contains = (value: string | null): StringPredicate | undefined =>
  value === null || value === '' ? undefined : ['contains', value]

export const eq = <A extends string>(value: A | null): EnumPredicate<A> | undefined =>
  value === null ? undefined : ['eq', value]

export const predicateValue = <A>(predicate: readonly [string, A] | undefined): A | null =>
  predicate === undefined ? null : predicate[1]
