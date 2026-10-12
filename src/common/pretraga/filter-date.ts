import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { fromYmd, toYmd } from '../domain/date/api'
import { dateEnds, dateFilterField, dateFromEnds, type DateFilterForm } from '../domain/field/filter-field'
import { DATE_OPERATORS, isRange } from './operator'
import { RANGE_SEPARATOR, type DatePredicate } from './predicate'

export type Form = DateFilterForm

export const ends = dateEnds

export const fromEnds = dateFromEnds

export const vForm = () =>
  Schema.NullOr(
    Schema.Tuple([Schema.Literal(...DATE_OPERATORS)], Schema.ValidDateFromSelf).pipe(
      Annotation.template(dateFilterField),
    ),
  )

export const toCriteria = (form: Form): DatePredicate | undefined => {
  if (form === null) return undefined
  const [operator, from, to] = form
  if (!isRange(operator)) return from === undefined ? undefined : [operator, toYmd(from)]
  return from === undefined || to === undefined ? undefined : [operator, `${toYmd(from)}${RANGE_SEPARATOR}${toYmd(to)}`]
}

export const fromCriteria = (predicate: DatePredicate | undefined): Form => {
  if (predicate === undefined) return null
  const [operator, raw] = predicate
  if (raw === undefined) return null

  if (!isRange(operator)) {
    const date = fromYmd(raw)
    return date === null ? null : [operator, date]
  }

  const [start, end] = raw.split(RANGE_SEPARATOR)
  const from = start === undefined ? null : fromYmd(start)
  const to = end === undefined ? null : fromYmd(end)
  return from === null || to === null ? null : [operator, from, to]
}
