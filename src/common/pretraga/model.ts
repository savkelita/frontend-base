import type * as Http from 'tea-effect/Http'
import type { AnyCriteria, PretragaResponse, Sort } from '../platform'

// -------------------------------------------------------------------------------------
// Стање листе
// -------------------------------------------------------------------------------------

/**
 * Претходна страна се памти док стиже нова, да табела не трепери на празно при сваком
 * листању — исти поступак као у затеченим пројектима.
 */
export type Podaci<R> =
  | { readonly _tag: 'Ucitava'; readonly prethodni: ReadonlyArray<R> }
  | { readonly _tag: 'Ucitano'; readonly redovi: ReadonlyArray<R>; readonly ukupno: number }
  | { readonly _tag: 'Greska'; readonly error: Http.HttpError }

export type Model<R, O extends string = string> = {
  readonly criteria: AnyCriteria
  readonly sort: ReadonlyArray<Sort<O>>
  readonly offset: number
  readonly podaci: Podaci<R>
  readonly izabrani: R | undefined
  /**
   * Бројач захтева. Одговор који стигне пошто је новији већ послат се одбацује — иста
   * заштита коју combo има, само овде вреди више јер корисник брзо кликће по страницама.
   */
  readonly seq: number
}

export const redovi = <R>(podaci: Podaci<R>): ReadonlyArray<R> => {
  switch (podaci._tag) {
    case 'Ucitava':
      return podaci.prethodni
    case 'Ucitano':
      return podaci.redovi
    case 'Greska':
      return []
  }
}

export const ukupno = <R>(podaci: Podaci<R>): number => (podaci._tag === 'Ucitano' ? podaci.ukupno : 0)

export const ucitava = <R>(podaci: Podaci<R>): boolean => podaci._tag === 'Ucitava'

export const ucitanoIz = <R>(odgovor: PretragaResponse<R>): Podaci<R> => ({
  _tag: 'Ucitano',
  redovi: odgovor.podaci,
  ukupno: odgovor.total,
})
