import type * as Http from 'tea-effect/Http'
import type { AnyCriteria, PretragaResponse } from '../platform'

// Порука носи ред (`R`) и назив колоне (`O`), па је генеричка. `Data.taggedEnum` за такве
// уније тражи експлицитне типске аргументе на сваком позиву и на `$match`-у — унија и
// конструктори руком су овде краћи и предвидљивији.
export type Msg<R, O extends string = string> =
  | { readonly _tag: 'Primljeno'; readonly seq: number; readonly odgovor: PretragaResponse<R> }
  | { readonly _tag: 'NijeUspelo'; readonly seq: number; readonly error: Http.HttpError }
  /** Клик на заглавље. Сорт се увек своди на ту једну колону. */
  | { readonly _tag: 'Sortiraj'; readonly kolona: O }
  | { readonly _tag: 'PromeniStranu'; readonly offset: number }
  | { readonly _tag: 'Osvezi' }
  | { readonly _tag: 'Izaberi'; readonly red: R }
  /** Двоклик — домаћин одлучује шта то значи. */
  | { readonly _tag: 'Otvori'; readonly red: R }
  | { readonly _tag: 'PrimeniKriterijume'; readonly criteria: AnyCriteria }

export const primljeno = <R, O extends string>(seq: number, odgovor: PretragaResponse<R>): Msg<R, O> => ({
  _tag: 'Primljeno',
  seq,
  odgovor,
})
export const nijeUspelo = <R, O extends string>(seq: number, error: Http.HttpError): Msg<R, O> => ({
  _tag: 'NijeUspelo',
  seq,
  error,
})
export const sortiraj = <R, O extends string>(kolona: O): Msg<R, O> => ({ _tag: 'Sortiraj', kolona })
export const promeniStranu = <R, O extends string>(offset: number): Msg<R, O> => ({ _tag: 'PromeniStranu', offset })
export const osvezi = <R, O extends string>(): Msg<R, O> => ({ _tag: 'Osvezi' })
export const izaberi = <R, O extends string>(red: R): Msg<R, O> => ({ _tag: 'Izaberi', red })
export const otvori = <R, O extends string>(red: R): Msg<R, O> => ({ _tag: 'Otvori', red })
export const primeniKriterijume = <R, O extends string>(criteria: AnyCriteria): Msg<R, O> => ({
  _tag: 'PrimeniKriterijume',
  criteria,
})

/**
 * Шта домаћин мора да уради. Листа не зна ни своју руту у адресној линији — промену стања
 * враћа кроз ишход, а домаћин је уписује у URL.
 */
export type Ishod<R> =
  | { readonly _tag: 'Nastavi' }
  /** Стање се променило: домаћин уписује нови URL, из ког листа поново креће. */
  | { readonly _tag: 'StanjePromenjeno' }
  | { readonly _tag: 'Otvoren'; readonly red: R }

export const nastaviIshod = <R>(): Ishod<R> => ({ _tag: 'Nastavi' })
export const stanjePromenjeno = <R>(): Ishod<R> => ({ _tag: 'StanjePromenjeno' })
export const otvoren = <R>(red: R): Ishod<R> => ({ _tag: 'Otvoren', red })
