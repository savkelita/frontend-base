import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { dropdownField, dropdownFieldMulti, type Choice } from '../../common/form/dropdown-field'

export type { Choice }

export type Form<A extends string> = A | null

export type FormMulti<A extends string> = ReadonlyArray<A> | null

const values = <A extends string>(choices: ReadonlyArray<Choice<A>>) => choices.map(c => c.value)

export const vForm = <const A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  Schema.Literal(...values(choices)).pipe(
    Annotation.template(dropdownField(choices)),
    Annotation.message((value: Form<A>) => (value === null ? 'Podatak je obavezan' : undefined)),
  )

/** Isti skup, vise izabranih. Opciono polje se pise kao `Schema.NullOr(Enum.vFormMulti(...))`. */
export const vFormMulti = <const A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  Schema.Array(Schema.Literal(...values(choices))).pipe(
    Schema.minItems(1),
    Annotation.template(dropdownFieldMulti(choices)),
    Annotation.message((value: FormMulti<A>) =>
      value === null || value.length === 0 ? 'Podatak je obavezan' : undefined,
    ),
  )
