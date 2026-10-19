import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { numberFilterField, type NumberFilterForm } from '../domain/field/filter-field'
import { format, normalize } from '../domain/field/number-field'
import { NUMBER_OPERATORS, isRange, type NumberOperator } from './operator'
import { RANGE_SEPARATOR, isNumberText, type NumberPredicate } from './predicate'

export type Operators = ReadonlyArray<NumberOperator>

export type Form = NumberFilterForm

export const vForm = (decimals = 0, operators: Operators = NUMBER_OPERATORS) =>
  Schema.NullOr(
    Schema.TupleWithRest(Schema.Tuple([Schema.Literals(operators)]), [Schema.String]).pipe(
      Annotation.template(numberFilterField(operators, decimals)),
    ),
  )

const entered = (text: string | undefined): string | null => {
  const value = text === undefined ? '' : normalize(text)
  return isNumberText(value) ? value : null
}

export const toCriteria = (form: Form): NumberPredicate | undefined => {
  if (form === null) return undefined
  const [operator, first, second] = form

  if (!isRange(operator)) {
    const value = entered(first)
    return value === null ? undefined : [operator, value]
  }

  const from = entered(first)
  const to = entered(second)
  return from === null || to === null ? undefined : [operator, `${from}${RANGE_SEPARATOR}${to}`]
}

export const fromCriteria = (predicate: NumberPredicate | undefined, decimals = 0): Form => {
  if (predicate === undefined) return null
  const [operator, raw] = predicate
  const shown = (value: string): string => format(Number(value), decimals)

  if (!isRange(operator)) return [operator, shown(raw)]

  const [from, to] = raw.split(RANGE_SEPARATOR)
  return from === undefined || to === undefined ? null : [operator, shown(from), shown(to)]
}
