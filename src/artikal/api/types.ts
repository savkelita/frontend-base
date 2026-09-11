import * as S from 'effect/Schema'
import { sBaseComboCriteria, sBaseComboResult, sTekstPredikat } from '../../common/platform'
import { ArtikalStanje } from '../domain/artikal-stanje'

// -------------------------------------------------------------------------------------
// Артикал — уговор
// -------------------------------------------------------------------------------------
//
// Типови су неутрални: ниједан од њих не зна ко их услужује. Разлика између Java и .NET
// стране живи искључиво у профилу (облик упита и одговора), не овде.
//
// Шема носи префикс `s`, тип стоји го: `sArtikalResult` је вредност, `ArtikalResult` тип.
// Критеријуми и колоне за сортирање су такође шеме, јер их рута прима као аргументе — из
// њих се изводи и тип и провера, па нигде нема напоредног списка који уме да застари.

// --- претрага ---

export const sArtikalResult = S.Struct({
  id: S.Number,
  version: S.Number,
  sifra: S.String,
  naziv: S.String,
  skraceniNaziv: S.String,
  jedinicaMereOznaka: S.String,
  grupaArtiklaNaziv: S.String,
  stanje: ArtikalStanje.Value,
})
export type ArtikalResult = typeof sArtikalResult.Type

/** Колоне по којима сервер уме да сортира. */
export const sArtikalOrder = S.Literal(
  'sifra',
  'naziv',
  'skraceniNaziv',
  'jedinicaMereOznaka',
  'grupaArtiklaNaziv',
  'stanje',
)
export type ArtikalOrder = typeof sArtikalOrder.Type

/**
 * По чему сервер уме да филтрира. Предикатска поља носе оператор уз вредност, идентитети
 * иду голи — исти распоред као `ioArtikalCriteria` у затеченим пројектима.
 */
export const sArtikalCriteria = S.Struct({
  sifra: S.optional(sTekstPredikat),
  naziv: S.optional(sTekstPredikat),
  skraceniNaziv: S.optional(sTekstPredikat),
  jedinicaMereID: S.optional(S.Number),
  grupaArtiklaID: S.optional(S.Number),
  stanje: S.optional(ArtikalStanje.Value),
})
export type ArtikalCriteria = typeof sArtikalCriteria.Type

// --- један артикал ---

export const sArtikalInfo = S.Struct({
  id: S.Number,
  version: S.Number,
  sifra: S.String,
  naziv: S.String,
  skraceniNaziv: S.String,
  jedinicaMereID: S.Number,
  jedinicaMereOznaka: S.String,
  grupaArtiklaID: S.Number,
  grupaArtiklaNaziv: S.String,
  kolicinaUJediniciMere: S.Number,
  stanje: ArtikalStanje.Value,
})
export type ArtikalInfo = typeof sArtikalInfo.Type

export const sDajArtikalParametri = S.Struct({ artikalID: S.Number })
export type DajArtikalParametri = typeof sDajArtikalParametri.Type

// --- команде ---

export const sKreirajArtikalCmd = S.Struct({
  sifra: S.String,
  naziv: S.String,
  skraceniNaziv: S.String,
  jedinicaMereID: S.Number,
  grupaArtiklaID: S.Number,
  kolicinaUJediniciMere: S.Number,
})
export type KreirajArtikalCmd = typeof sKreirajArtikalCmd.Type

export const sAzurirajArtikalCmd = S.Struct({
  id: S.Number,
  version: S.Number,
  ...sKreirajArtikalCmd.fields,
})
export type AzurirajArtikalCmd = typeof sAzurirajArtikalCmd.Type

// --- угнежђена листа: паковања артикла ---

export const sArtikalPakovanjeResult = S.Struct({
  id: S.Number,
  version: S.Number,
  pakovanjeNaziv: S.String,
  kolicina: S.Number,
  jedinicaMereOznaka: S.String,
})
export type ArtikalPakovanjeResult = typeof sArtikalPakovanjeResult.Type

export const sArtikalPakovanjeOrder = S.Literal('pakovanjeNaziv', 'kolicina')
export type ArtikalPakovanjeOrder = typeof sArtikalPakovanjeOrder.Type

export const sArtikalPakovanjeCriteria = S.Struct({ artikalID: S.optional(S.Number) })
export type ArtikalPakovanjeCriteria = typeof sArtikalPakovanjeCriteria.Type

// --- combo ---
//
// Језгро `{ id, sifra, naziv }` стоји у `common`; combo који носи још нешто прави се са
// `sComboResult({ … })`.

export const sJedinicaMereComboResult = sBaseComboResult
export type JedinicaMereComboResult = typeof sJedinicaMereComboResult.Type

export const sGrupaArtiklaComboResult = sBaseComboResult
export type GrupaArtiklaComboResult = typeof sGrupaArtiklaComboResult.Type

// Ниједан од ова два не тражи по нечему свом — само по `id` и по откуцаном тексту.
export const sJedinicaMereComboCriteria = sBaseComboCriteria
export type JedinicaMereComboCriteria = typeof sJedinicaMereComboCriteria.Type

export const sGrupaArtiklaComboCriteria = sBaseComboCriteria
export type GrupaArtiklaComboCriteria = typeof sGrupaArtiklaComboCriteria.Type
