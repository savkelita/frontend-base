import { Schema } from 'effect'
import * as Enum from '../../../common/domain/enum'

export const CHOICES = [
  { value: 'ISTEKAO', text: 'Istekao datum registracije' },
  { value: 'OD_1_DO_3_DANA', text: '1-3 dana' },
  { value: 'OD_4_DO_7_DANA', text: '4-7 dana' },
  { value: 'NIJE_ISTEKAO', text: 'Nije istekao' },
] as const

export type Value = (typeof CHOICES)[number]['value']

export const ioValue = Schema.Literal(...CHOICES.map(c => c.value))

export const text = (istek: Value): string => CHOICES.find(c => c.value === istek)?.text ?? istek

export type Form = Enum.Form<Value>

export const vForm = Enum.vForm(CHOICES)
