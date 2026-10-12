import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.KorisnikVozilaCombo

export type Form = Combo.Form<Value>

export const ioValue = Api.KorisnikVozilaCombo

export const id = (korisnik: Value): number => korisnik.id

export const render = (korisnik: Value): string => korisnik.naziv

export const search = Api.pretraziKorisnikVozilaCombo

export const vForm = Combo.vForm(ioValue, { id, render })
