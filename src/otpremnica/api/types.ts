import * as S from 'effect/Schema'
import { sBrojPredikat, sComboCriteria, sIdKriterijum, sTekstPredikat } from '../../common/platform'

// -------------------------------------------------------------------------------------
// Artikal pakovanje combo (otpremnica)
// -------------------------------------------------------------------------------------

export const sArtikalPakovanjeOtpremnicaComboResult = S.Struct({
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
export type ArtikalPakovanjeOtpremnicaComboResult = typeof sArtikalPakovanjeOtpremnicaComboResult.Type

export const sArtikalPakovanjeOtpremnicaComboCriteria = sComboCriteria({ artikalID: S.optional(sIdKriterijum) })
export type ArtikalPakovanjeOtpremnicaComboCriteria = typeof sArtikalPakovanjeOtpremnicaComboCriteria.Type

// -------------------------------------------------------------------------------------
// Stavka porudzbenice combo (otpremnica)
// -------------------------------------------------------------------------------------

export const sStavkaPorudzbeniceOtpremnicaComboResult = S.Struct({
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
export type StavkaPorudzbeniceOtpremnicaComboResult = typeof sStavkaPorudzbeniceOtpremnicaComboResult.Type

// `porudzbenicaID` је необавезан: екран за креирање ставке отпремнице још не сужава combo
// по поруџбеници, па би обавезно поље лагало о томе шта се шаље.
export const sStavkaPorudzbeniceOtpremnicaComboCriteria = sComboCriteria({
  porudzbenicaID: S.optional(sIdKriterijum),
})
export type StavkaPorudzbeniceOtpremnicaComboCriteria = typeof sStavkaPorudzbeniceOtpremnicaComboCriteria.Type

// -------------------------------------------------------------------------------------
// Ставка отпремнице — претрага
// -------------------------------------------------------------------------------------

export const sStavkaOtpremniceResult = S.Struct({
  id: S.Number,
  version: S.Number,
  redniBroj: S.Number,
  artikalSifra: S.String,
  artikalNaziv: S.String,
  pakovanjeNaziv: S.String,
  kolicina: S.Number,
  osnovnaKolicina: S.NullOr(S.Number),
  osnovnaJedinicaMereOznaka: S.String,
})
export type StavkaOtpremniceResult = typeof sStavkaOtpremniceResult.Type

/** Колоне по којима сервер уме да сортира. */
export const sStavkaOtpremniceOrder = S.Literal('redniBroj', 'artikalSifra', 'artikalNaziv', 'kolicina')
export type StavkaOtpremniceOrder = typeof sStavkaOtpremniceOrder.Type

/** Имена су она која рута већ прима; `otpremnicaID` додаје екран, не корисник. */
export const sStavkaOtpremniceCriteria = S.Struct({
  otpremnicaID: S.optional(S.Number),
  redniBroj: S.optional(sBrojPredikat),
  kolicina: S.optional(sBrojPredikat),
  serijskiBroj: S.optional(sTekstPredikat),
})
export type StavkaOtpremniceCriteria = typeof sStavkaOtpremniceCriteria.Type

// Паковања се претражују и као обична листа (ради дохватања реда иза изабране ставке
// поруџбенице), па и та рута мора да каже шта прима.
export const sArtikalPakovanjeOtpremnicaOrder = S.Literal('pakovanjeNaziv')
export type ArtikalPakovanjeOtpremnicaOrder = typeof sArtikalPakovanjeOtpremnicaOrder.Type

// -------------------------------------------------------------------------------------
// Stavka otpremnice — komanda za kreiranje
// -------------------------------------------------------------------------------------

export const sKreirajStavkaOtpremniceCmd = S.Struct({
  otpremnicaID: S.Number,
  redniBroj: S.Number,
  artikalPakovanjeID: S.Number,
  stavkaPorudzbeniceID: S.NullOr(S.Number),
  kolicina: S.Number,
  osnovnaKolicina: S.NullOr(S.Number),
  kreirajMagacinArtikalPakovanje: S.NullOr(S.Boolean),
})
export type KreirajStavkaOtpremniceCmd = typeof sKreirajStavkaOtpremniceCmd.Type
