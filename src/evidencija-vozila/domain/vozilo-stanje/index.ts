import * as Enum from '../../../common/domain/enum'

const KEYS = {
  AKTIVAN: 'Aktivan',
  PASIVAN: 'Pasivan',
}

export type Value = keyof typeof KEYS

export type Form = Enum.Form<Value>

export const ioValue = Enum.ioValue(KEYS)

export const vForm = Enum.vForm(KEYS)

export const text = (stanje: Value): string => KEYS[stanje]
