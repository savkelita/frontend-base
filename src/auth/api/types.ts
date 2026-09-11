import * as S from 'effect/Schema'

// -------------------------------------------------------------------------------------
// Аутентикација
// -------------------------------------------------------------------------------------
//
// Сесија стоји у колачићу — апликација токен не држи и не види. Одговор носи само оно што
// је потребно за мени и заштиту рута, плус колико још траје.

export const sPrijava = S.Struct({
  korisnickoIme: S.String,
  lozinka: S.String,
})
export type Prijava = typeof sPrijava.Type

export const sPravo = S.Struct({ name: S.String })
export type Pravo = typeof sPravo.Type

/**
 * `istekZaSekundi` је релативно, не апсолутно време. Разлика у сату између клијента и
 * сервера тако не помера тренутак истека.
 */
export const sSesijaOdgovor = S.Struct({
  korisnickoIme: S.String,
  authorizations: S.Array(sPravo),
  istekZaSekundi: S.Number,
})
export type SesijaOdgovor = typeof sSesijaOdgovor.Type
