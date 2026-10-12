import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.MarkaVozilaCombo

export type Form = Combo.Form<Value>

export const ioValue = Api.MarkaVozilaCombo

export const id = (marka: Value): string => marka.marka

export const render = (marka: Value): string => marka.marka

export const search = Api.pretraziMarkaVozilaCombo

export const vForm = Combo.vForm(ioValue, { id, render })

export const fromText = (marka: string): Value => ({ marka })
