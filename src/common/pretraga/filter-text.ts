import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { textFilterField, type TextFilterForm } from '../domain/field/filter-field'
import { STRING_OPERATORS, type SingleOperator, type StringOperator } from './operator'
import { ioStringPredicateOf } from './predicate'

export type Operators = ReadonlyArray<Extract<StringOperator, SingleOperator>>

export type Form = TextFilterForm

export const vForm = (operators: Operators = STRING_OPERATORS) =>
  Schema.NullOr(ioStringPredicateOf(operators).pipe(Annotation.template(textFilterField(operators))))

export const toCriteria = (form: Form): readonly [StringOperator, string] | undefined => {
  if (form === null) return undefined
  const entered = form[1].trim()
  return entered === '' ? undefined : [form[0], entered]
}
