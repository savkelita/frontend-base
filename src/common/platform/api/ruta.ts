import type * as Http from 'tea-effect/Http'
import type { AnyCriteria, PretragaRequest, PretragaResponse } from '../contract'

// -------------------------------------------------------------------------------------
// Облик руте
// -------------------------------------------------------------------------------------
//
// Рута није гола функција него декларација: носи и оно чиме сме да буде позвана. Све то
// стиже из шема које се предају градитељу, па се ниједан тип не наводи руком:
//
//   export const pretraziArtikal = api.pretraga(
//     'pretraziArtikal', sArtikalResult, sArtikalCriteria, sArtikalOrder)
//
// Без шеме критеријума и колона, `sort: [['bilo_sta', 'ASC']]` би прошао компајлер — јер
// би се тип закључивао из позива, а не из руте.

export type Pretraga<C, O extends string, A> = ((
  request: PretragaRequest<C, O>,
) => Http.Request<PretragaResponse<A>>) & {
  /**
   * Колоне по којима сервер уме да сортира. Долазе из исте шеме из које и тип, па екран
   * више не држи свој напоредни списак који уме да застари.
   */
  readonly kolone: ReadonlyArray<O>
  /** Имена критеријума које рута прима; све остало испада пре слања. */
  readonly polja: ReadonlyArray<string>
}

/** `dajArtikal`, `dajStavku` — један запис по идентификатору. */
export type Info<P, A> = (parametri: P) => Http.Request<A>

/** GET са произвољним параметрима у упиту. */
export type Upit<P extends AnyCriteria, A> = (parametri: P) => Http.Request<A>

/** Команда без одговора; са одговором — други параметар. */
export type Komanda<A, B = void> = (telo: A) => Http.Request<B>
