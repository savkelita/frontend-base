import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.KategorijaVozackeDozvoleCombo

export type Form = Combo.Form<Value>

export type FormMulti = Combo.FormMulti<Value>

export const ioValue = Api.KategorijaVozackeDozvoleCombo

export const id = (kategorija: Value): number => kategorija.id

export const render = (kategorija: Value): string => kategorija.oznaka

export const search = Api.pretraziKategorijaVozackeDozvoleCombo

export const vForm = Combo.vForm(ioValue, { id, render })

export const vFormMulti = Combo.vFormMulti(ioValue, { id, render })
