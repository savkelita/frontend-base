import * as S from 'effect/Schema'
import type { BaseComboCriteria } from '../../common/pretraga'

// -------------------------------------------------------------------------------------
// Artikal pakovanje combo (otpremnica)
// -------------------------------------------------------------------------------------

export const ArtikalPakovanjeOtpremnicaComboResult = S.Struct({
  id: S.Number,
  artikalID: S.Number,
  artikalSifra: S.String,
  artikalNaziv: S.String,
  artikalBarKod: S.NullOr(S.String),
  osnovniArtikal: S.Boolean,
  jedinicaMereSifra: S.String,
  jedinicaMereOznaka: S.String,
  osnovnaJedinicaMereSifra: S.String,
  osnovnaJedinicaMereOznaka: S.String,
  osnovnaJedinicaMereNaziv: S.String,
  pakovanjeNaziv: S.String,
  barKod: S.NullOr(S.String),
  kolicinaUPakovanju: S.Number,
  kolicinaUOsnovnojJM: S.Number,
  pakovanjeDimenzijaSifra: S.String,
  pakovanjeDimenzijaNaziv: S.String,
  sirina: S.Number,
  duzina: S.Number,
  visina: S.Number,
  jedinicaMereZaDuzinuSifra: S.String,
  jedinicaMereZaDuzinuOznaka: S.String,
  jedinicaMereZaDuzinuNaziv: S.String,
  brutoTezina: S.Number,
  jedinicaMereZaTezinuSifra: S.String,
  jedinicaMereZaTezinuOznaka: S.String,
  jedinicaMereZaTezinuNaziv: S.String,
})
export type ArtikalPakovanjeOtpremnicaComboResult = typeof ArtikalPakovanjeOtpremnicaComboResult.Type

export type ArtikalPakovanjeOtpremnicaComboCriteria = BaseComboCriteria & { readonly artikalID?: string }

// -------------------------------------------------------------------------------------
// Stavka porudzbenice combo (otpremnica)
// -------------------------------------------------------------------------------------

export const StavkaPorudzbeniceOtpremnicaComboResult = S.Struct({
  id: S.Number,
  redniBroj: S.Number,
  artikalID: S.Number,
  artikalPakovanjeID: S.Number,
  artikalSifra: S.String,
  artikalNaziv: S.String,
  artikalPakovanjeNaziv: S.String,
  porucenaKolicina: S.Number,
  porucenaOsnovnaKolicina: S.Number,
  osnovnaJedinicaMereOznaka: S.String,
})
export type StavkaPorudzbeniceOtpremnicaComboResult = typeof StavkaPorudzbeniceOtpremnicaComboResult.Type

export type StavkaPorudzbeniceOtpremnicaComboCriteria = BaseComboCriteria & { readonly porudzbenicaID: string }

// -------------------------------------------------------------------------------------
// Stavka otpremnice — komanda za kreiranje
// -------------------------------------------------------------------------------------

export const KreirajStavkaOtpremniceCmd = S.Struct({
  otpremnicaID: S.Number,
  redniBroj: S.Number,
  artikalPakovanjeID: S.Number,
  stavkaPorudzbeniceID: S.NullOr(S.Number),
  kolicina: S.Number,
  osnovnaKolicina: S.NullOr(S.Number),
  kreirajMagacinArtikalPakovanje: S.NullOr(S.Boolean),
})
export type KreirajStavkaOtpremniceCmd = typeof KreirajStavkaOtpremniceCmd.Type
