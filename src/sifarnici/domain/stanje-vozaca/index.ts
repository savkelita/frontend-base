import { Schema } from 'effect'
import * as Enum from '../../../common/domain/enum'

export const CHOICES = [
  { value: 'AKTIVAN', text: 'Aktivan' },
  { value: 'PASIVAN', text: 'Pasivan' },
] as const

export type Value = (typeof CHOICES)[number]['value']

export const ioValue = Schema.Literal(...CHOICES.map(c => c.value))

export const text = (stanje: Value): string => CHOICES.find(c => c.value === stanje)?.text ?? stanje

export type Form = Enum.Form<Value>

export const vForm = Enum.vForm(CHOICES)
