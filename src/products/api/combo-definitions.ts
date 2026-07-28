import * as Pretraga from '../../common/pretraga'
import { pretraziProizvodCombo, pretraziGrupaCombo, pretraziPodgrupaCombo } from './routes'

// -------------------------------------------------------------------------------------
// Combo definitions — the sources `Form.combo` consumes (route + label mapping)
// -------------------------------------------------------------------------------------
//
// Kept together (like Magacin's `combo-definitions`) so a form only names the source:
//   Form.combo({ label: 'Grupa', source: Api.grupaCombo })
//
// Results follow the `{ id, sifra?, naziv }` convention, so the label is derived
// automatically: `sifra - naziv`, or just `naziv` when there is no sifra. Pass an explicit
// mapper only for a non-standard label, e.g.:
//   pretragaCombo(pretraziKorisnikCombo, k => ({ value: String(k.id), label: `${k.ime} ${k.prezime}` }))

// Proizvod result has no `sifra` -> label is just `naziv`.
export const proizvodCombo = Pretraga.pretragaCombo(pretraziProizvodCombo)

// Grupa/Podgrupa results have `sifra` -> label is `sifra - naziv`.
export const grupaCombo = Pretraga.pretragaCombo(pretraziGrupaCombo)
export const podgrupaCombo = Pretraga.pretragaCombo(pretraziPodgrupaCombo)
