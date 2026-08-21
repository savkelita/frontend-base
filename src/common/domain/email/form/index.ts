import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { textField, type TextForm } from '../../common/form/text-field'

export const MAX_LENGTH = 80

const PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export type Form = TextForm

export const vForm = Schema.Trim.pipe(
  Schema.nonEmptyString(),
  Schema.maxLength(MAX_LENGTH),
  Schema.pattern(PATTERN),
  Annotation.template(textField),
  Annotation.message((value: Form) => {
    const uneto = value === null ? '' : value.trim()
    if (uneto === '') return 'Podatak je obavezan'
    if (uneto.length > MAX_LENGTH) return `Unesena vrednost ne sme biti duza od ${MAX_LENGTH} karaktera`
    return PATTERN.test(uneto) ? undefined : 'Podatak nije validan'
  }),
)
