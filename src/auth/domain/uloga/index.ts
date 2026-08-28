import * as Enum from '../../../common/domain/enum'

const KEYS = {
  ADMINISTRATOR: 'Administrator',
  REFERENT: 'Referent',
  REFERENT_KAZNE: 'Referent za kazne',
}

export type Value = keyof typeof KEYS

export type Uloge = readonly [Value, ...ReadonlyArray<Value>]

export type Form = Enum.Form<Value>

export const ioValue = Enum.ioValue(KEYS)

export const vForm = (uloge: ReadonlyArray<Value>) => Enum.vForm(KEYS, uloge)

export const text = (uloga: Value): string => KEYS[uloga]
