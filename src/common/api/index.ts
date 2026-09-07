import * as S from 'effect/Schema'

// -------------------------------------------------------------------------------------
// Zajednički API ugovor
// -------------------------------------------------------------------------------------

/** Identitet objekta za izmenu/brisanje: optimističko zaključavanje po id + version. */
export const ObjekatIdentifikator = S.Struct({ id: S.Number, version: S.Number })
export type ObjekatIdentifikator = typeof ObjekatIdentifikator.Type
