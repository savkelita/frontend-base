import * as Enum from '../../../common/domain/enum'

const KEYS = {
  ISTEKAO: 'Istekao datum registracije',
  OD_1_DO_3_DANA: '1-3 dana',
  OD_4_DO_7_DANA: '4-7 dana',
  NIJE_ISTEKAO: 'Nije istekao',
}

export type Value = keyof typeof KEYS

export type Form = Enum.Form<Value>

export const ioValue = Enum.ioValue(KEYS)

export const vForm = Enum.vForm(KEYS)

export const text = (istek: Value): string => KEYS[istek]
