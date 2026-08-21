import { Schema } from 'effect'
import * as Enum from '../../../common/domain/enum'
import type { Choice } from '../../../common/domain/enum'

export const CHOICES = [
  { value: 'ADMINISTRATOR', text: 'Administrator' },
  { value: 'REFERENT', text: 'Referent' },
  { value: 'REFERENT_KAZNE', text: 'Referent za kazne' },
] as const satisfies ReadonlyArray<Choice<string>>

export type Value = (typeof CHOICES)[number]['value']

export type Uloge = readonly [Value, ...ReadonlyArray<Value>]

export type Form = Enum.Form<Value>

export const ioValue = Schema.Literal(...CHOICES.map(c => c.value))

export const vForm = (uloge: ReadonlyArray<Value>) =>
  Enum.vForm(CHOICES.filter((c): c is (typeof CHOICES)[number] => uloge.includes(c.value)))

export const text = (uloga: Value): string => CHOICES.find(c => c.value === uloga)?.text ?? uloga
