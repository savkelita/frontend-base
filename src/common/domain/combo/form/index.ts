import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { comboField, type Render } from '../../common/form/combo-field'
import { multiComboField } from '../../common/form/multi-combo-field'

export type { ComboFieldOptions as FieldOptions, Render } from '../../common/form/combo-field'
export type { MultiComboFieldOptions as FieldOptionsMulti } from '../../common/form/multi-combo-field'

export type Form<A> = A | null

export type FormMulti<A> = ReadonlyArray<A>

export const vForm = <A, I extends A | null, R>(io: Schema.Schema<A, I, R>, render: Render<A>) =>
  io.pipe(
    Annotation.template(comboField<A>(render)),
    Annotation.message((value: Form<A>) => (value === null ? 'Podatak je obavezan' : undefined)),
  )

export const vFormMulti = <A, I extends A, R>(io: Schema.Schema<A, I, R>, render: Render<A>) =>
  Schema.Array(io).pipe(
    Schema.minItems(1),
    Annotation.template(multiComboField<A>(render)),
    Annotation.message((value: FormMulti<A>) => (value.length === 0 ? 'Podatak je obavezan' : undefined)),
  )
