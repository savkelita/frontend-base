import * as Pretraga from '../../common/pretraga'
import { pretraziArtikalPakovanjeOtpremnicaCombo, pretraziStavkaPorudzbeniceOtpremnicaCombo } from './routes'

// -------------------------------------------------------------------------------------
// Izvori za combo — ruta + mapiranje labele, imenovani jednom i deljeni svim formama
// -------------------------------------------------------------------------------------
//
// Nijedan od dva rezultata ne nosi standardni par sifra/naziv, pa su obe labele zadate
// izričito, onako kako se ovi combo-i čitaju i na ostalim mestima.

export const ArtikalPakovanjeOtpremnicaCombo = Pretraga.pretragaCombo(
  pretraziArtikalPakovanjeOtpremnicaCombo,
  item => ({
    value: String(item.id),
    label: item.pakovanjeDimenzijaNaziv,
  }),
)

export const StavkaPorudzbeniceOtpremnicaCombo = Pretraga.pretragaCombo(
  pretraziStavkaPorudzbeniceOtpremnicaCombo,
  item => ({ value: String(item.id), label: `${item.redniBroj} - ${item.artikalSifra} - ${item.artikalNaziv}` }),
)
