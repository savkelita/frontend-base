import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.VrstaGorivaCombo

export type Form = Combo.Form<Value>

export const ioValue = Api.VrstaGorivaCombo

export const id = (vrsta: Value): number => vrsta.id

export const render = (vrsta: Value): string => vrsta.naziv

export const search = Api.pretraziVrstaGorivaCombo

export const vForm = Combo.vForm(ioValue, { id, render })
