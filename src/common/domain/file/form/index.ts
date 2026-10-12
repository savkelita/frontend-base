import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { fileField, type FileForm } from '../../field/file-field'

export type { FileFieldOptions as FieldOptions, UploadedFile as Value } from '../../field/file-field'
export { MAX_BYTES, extension, formatSize } from '../../field/file-field'

export type Form = FileForm

export const ioValue = Schema.Struct({
  name: Schema.String,
  content: Schema.String,
})

export const vForm = ioValue.pipe(
  Annotation.template(fileField),
  Annotation.message((value: Form) => (value === null ? 'Podatak je obavezan' : undefined)),
)
