import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { dropdownField, dropdownFieldMulti, type Choice } from '../../field/dropdown-field'

export type Keys = Readonly<Record<string, string>>

type Value<K extends Keys> = keyof K & string

export type Form<A extends string> = A | null

export type FormMulti<A extends string> = ReadonlyArray<A> | null

const choices = <K extends Keys>(keys: K, only?: ReadonlyArray<Value<K>>): ReadonlyArray<Choice<Value<K>>> =>
  (Object.keys(keys) as ReadonlyArray<Value<K>>)
    .filter(value => only === undefined || only.includes(value))
    .map(value => ({ value, text: keys[value] }))

export const ioValue = <K extends Keys>(keys: K) => Schema.Literal(...(Object.keys(keys) as ReadonlyArray<Value<K>>))

/** `only` suzava ponudu u vreme izvrsavanja; tip vrednosti ostaje ceo skup. */
export const vForm = <K extends Keys>(keys: K, only?: ReadonlyArray<Value<K>>) => {
  const list = choices(keys, only)
  return Schema.Literal(...list.map(c => c.value)).pipe(
    Annotation.template(dropdownField(list)),
    Annotation.message((value: Form<Value<K>>) => (value === null ? 'Podatak je obavezan' : undefined)),
  )
}

/** Isti skup, vise izabranih. Opciono polje se pise kao `Schema.NullOr(Enum.vFormMulti(...))`. */
export const vFormMulti = <K extends Keys>(keys: K) => {
  const list = choices(keys)
  return Schema.Array(Schema.Literal(...list.map(c => c.value))).pipe(
    Schema.minItems(1),
    Annotation.template(dropdownFieldMulti(list)),
    Annotation.message((value: FormMulti<Value<K>>) =>
      value === null || value.length === 0 ? 'Podatak je obavezan' : undefined,
    ),
  )
}
