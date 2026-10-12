import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { booleanField, type BooleanForm } from '../../field/boolean-field'

export type Form = BooleanForm

export const vForm = Schema.Boolean.pipe(
  Annotation.template(booleanField),
  Annotation.message((value: Form) => (value === null ? 'Podatak je obavezan' : undefined)),
)
