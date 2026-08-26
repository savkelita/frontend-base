import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.VozacCombo

export type Form = Combo.Form<Value>

export const ioValue = Api.VozacCombo

export const id = (vozac: Value): number => vozac.id

export const render = (vozac: Value): string => `${vozac.ime} ${vozac.prezime} (${vozac.imeZaPrikaz})`

export const search = Api.pretraziVozacCombo

export const vForm = Combo.vForm(ioValue, { id, render })
