import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { fileField, type FileForm } from '../../field/file-field'

export type { FileFieldOptions as FieldOptions, Fajl as Value } from '../../field/file-field'
export { MAX_BYTES, extension, formatSize } from '../../field/file-field'

export type Form = FileForm

export const ioValue = Schema.Struct({
  naziv: Schema.String,
  sadrzaj: Schema.String,
})

export const vForm = ioValue.pipe(
  Annotation.template(fileField),
  Annotation.message((value: Form) => (value === null ? 'Podatak je obavezan' : undefined)),
)
