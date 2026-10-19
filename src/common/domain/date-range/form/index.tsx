import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { dateRangeField, type DateRangeForm } from '../../field/date-range-field'

export type Form = DateRangeForm

export const vForm = Schema.Tuple([Schema.NullOr(Schema.Date), Schema.NullOr(Schema.Date)]).pipe(
  Annotation.template(dateRangeField),
)
