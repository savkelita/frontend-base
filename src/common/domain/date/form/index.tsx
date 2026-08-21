import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { dateField, type DateForm } from '../../common/form/date-field'

export type Form = DateForm

export const vForm = Schema.ValidDateFromSelf.pipe(
  Annotation.template(dateField),
  Annotation.message((value: Form) =>
    value === null ? 'Podatak je obavezan' : Number.isNaN(value.getTime()) ? 'Unesite ispravan datum' : undefined,
  ),
)
