import * as S from 'effect/Schema'
import type { BaseComboCriteria } from '../../common/pretraga'

// -------------------------------------------------------------------------------------
// Artikal combo
// -------------------------------------------------------------------------------------

export const ArtikalComboResult = S.Struct({
  id: S.Number,
  sifra: S.String,
  naziv: S.String,
  skraceniNaziv: S.String,
  kolicinaUJediniciMere: S.Number,
  koeficijentKonverzije: S.Number,
  eanKod: S.NullOr(S.String),
  podgrupaArtiklaID: S.Number,
})
export type ArtikalComboResult = typeof ArtikalComboResult.Type

export type ArtikalComboCriteria = BaseComboCriteria & {
  readonly jeOsnovni?: string
  readonly podgrupaArtiklaID?: string
  readonly ukljuciNeaktivne?: string
  readonly magacinID?: string
}
