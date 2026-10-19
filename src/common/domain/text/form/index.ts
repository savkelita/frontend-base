import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { textField, type TextForm } from '../../field/text-field'

export type Form = TextForm

export const vForm = (maxLength: number) =>
  Schema.Trim.pipe(
    Schema.check(Schema.isNonEmpty(), Schema.isMaxLength(maxLength)),
    Annotation.template(textField),
    Annotation.message((value: Form) =>
      value === null || value.trim() === ''
        ? 'Podatak je obavezan'
        : value.trim().length > maxLength
          ? `Unesena vrednost ne sme biti duza od ${maxLength} karaktera`
          : undefined,
    ),
  )
