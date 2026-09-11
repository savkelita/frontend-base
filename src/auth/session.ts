import * as S from 'effect/Schema'
import type { SesijaOdgovor } from './api'
import type { AuthorizationConfig } from './types'

// -------------------------------------------------------------------------------------
// Сесија
// -------------------------------------------------------------------------------------
//
// Токена овде нема: држи га прегледач у колачићу. Апликација памти само оно што јој треба
// за мени, заштиту рута и одбројавање до истека.

export const sSesija = S.Struct({
  korisnickoIme: S.String,
  prava: S.Array(S.String),
  /** Тренутак истека, израчунат из релативног `istekZaSekundi` при пријави. */
  istice: S.Number,
})
export type Sesija = typeof sSesija.Type

/**
 * Кључ у `localStorage`. Служи двоструко: за брзо прво исцртавање и као канал којим се
 * картице обавештавају о пријави и одјави (`storage` догађај).
 */
export const SESIJA_KLJUC = 'sesija'

export const izOdgovora = (odgovor: SesijaOdgovor, sada: number = Date.now()): Sesija => ({
  korisnickoIme: odgovor.korisnickoIme,
  prava: odgovor.authorizations.map(p => p.name),
  istice: sada + odgovor.istekZaSekundi * 1000,
})

export const toAuthorizationConfig = (sesija: Sesija): AuthorizationConfig => ({ permissions: sesija.prava })

/** Колико још траје, у секундама; никад мање од нуле. */
export const preostaloSekundi = (sesija: Sesija, sada: number = Date.now()): number =>
  Math.max(0, Math.round((sesija.istice - sada) / 1000))
