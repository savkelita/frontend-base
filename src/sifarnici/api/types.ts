import * as S from 'effect/Schema'
import { sComboCriteria } from '../../common/platform'

// -------------------------------------------------------------------------------------
// Артикал combo
// -------------------------------------------------------------------------------------

export const sArtikalComboResult = S.Struct({
  id: S.Number,
  sifra: S.String,
  naziv: S.String,
  skraceniNaziv: S.String,
  kolicinaUJediniciMere: S.Number,
  koeficijentKonverzije: S.Number,
  eanKod: S.NullOr(S.String),
  podgrupaArtiklaID: S.Number,
})
export type ArtikalComboResult = typeof sArtikalComboResult.Type

export const sArtikalComboCriteria = sComboCriteria({
  jeOsnovni: S.optional(S.String),
  podgrupaArtiklaID: S.optional(S.String),
  ukljuciNeaktivne: S.optional(S.String),
  magacinID: S.optional(S.String),
})
export type ArtikalComboCriteria = typeof sArtikalComboCriteria.Type
