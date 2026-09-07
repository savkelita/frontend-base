import * as Pretraga from '../../common/pretraga'
import { pretraziArtikalCombo } from './routes'

// -------------------------------------------------------------------------------------
// Izvori za combo — ruta + mapiranje labele, imenovani jednom i deljeni svim formama
// -------------------------------------------------------------------------------------

export const ArtikalCombo = Pretraga.pretragaCombo(pretraziArtikalCombo, item => ({
  value: String(item.id),
  label: `${item.sifra} - ${item.naziv}`,
}))
