import * as S from 'effect/Schema'

// -------------------------------------------------------------------------------------
// Magacin artikal pakovanje
// -------------------------------------------------------------------------------------

/** Da li magacin već poznaje ovo pakovanje ovog artikla. */
export const sMagacinArtikalPakovanjeInfo = S.Struct({ postoji: S.Boolean })
export type MagacinArtikalPakovanjeInfo = typeof sMagacinArtikalPakovanjeInfo.Type
