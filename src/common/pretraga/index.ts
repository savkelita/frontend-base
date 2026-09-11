import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type { AnyCriteria, PretragaRequest, PretragaResponse, Sort } from '../platform'
import type { Ishod, Msg } from './msg'
import { nastaviIshod, nijeUspelo, otvoren, primljeno as primljenoMsg, stanjePromenjeno } from './msg'
import type { Model, Podaci } from './model'
import { ucitanoIz } from './model'
import type { StanjeListe } from './url'

export * from './model'
export * from './url'
export type { Sort, SortDirection, AnyCriteria, PretragaRequest, PretragaResponse } from '../platform'
export type { Msg, Ishod } from './msg'
export * from './msg'
export type { Kolona } from './tabela'
export { Tabela } from './tabela'
export { Paginacija } from './paginacija'

// -------------------------------------------------------------------------------------
// Листа — претрага, страничење, сортирање
// -------------------------------------------------------------------------------------
//
// URL је извор истине. Свака промена стања (сорт, страна, критеријуми) враћа се домаћину
// као `StanjePromenjeno`; домаћин уписује нови URL, рутер поново диже екран, и листа креће
// из `init` са новим стањем. Тако освежавање и дугме „назад" раде без додатног кода.

/**
 * `C` је тип критеријума које рута прима. Листа их сама држи нетипизиране — стижу из
 * адресне линије, а она је улаз као и сваки други — али рута сме да буде строга, па се тип
 * наводи овде и сужавање се дешава на једном месту (`zahtevIz` испод).
 */
export type Konfiguracija<R, O extends string, C = AnyCriteria> = {
  readonly ruta: (zahtev: PretragaRequest<C, O>) => Http.Request<PretragaResponse<R>>
  readonly limit?: number
}

export const PODRAZUMEVANI_LIMIT = 20

const zahtevIz = <R, O extends string, C>(
  konfiguracija: Konfiguracija<R, O, C>,
  model: Model<R, O>,
): PretragaRequest<C, O> => ({
  limit: konfiguracija.limit ?? PODRAZUMEVANI_LIMIT,
  offset: model.offset,
  // Критеријуми долазе из адресне линије, коју корисник сме да откуца руком, па их ниједан
  // тип не гарантује. Рута их сама своди на своја поља пре слања.
  criteria: model.criteria as C,
  sort: model.sort,
})

const posalji = <R, O extends string, C>(
  konfiguracija: Konfiguracija<R, O, C>,
  model: Model<R, O>,
): [Model<R, O>, Cmd.Cmd<Msg<R, O>>] => {
  const seq = model.seq + 1
  const uToku: Model<R, O> = {
    ...model,
    seq,
    podaci: { _tag: 'Ucitava', prethodni: model.podaci._tag === 'Ucitano' ? model.podaci.redovi : [] },
  }
  return [
    uToku,
    Http.send(konfiguracija.ruta(zahtevIz(konfiguracija, uToku)), {
      onSuccess: odgovor => primljenoMsg<R, O>(seq, odgovor),
      onError: error => nijeUspelo<R, O>(seq, error),
    }),
  ]
}

/** Диже листу из стања које је прочитано из URL-а и одмах шаље претрагу. */
export const init = <R, O extends string, C>(
  konfiguracija: Konfiguracija<R, O, C>,
  stanje: StanjeListe<O>,
): [Model<R, O>, Cmd.Cmd<Msg<R, O>>] =>
  posalji(konfiguracija, {
    criteria: stanje.criteria,
    sort: stanje.sort,
    offset: stanje.offset,
    podaci: { _tag: 'Ucitava', prethodni: [] } as Podaci<R>,
    izabrani: undefined,
    seq: 0,
  })

/** Стање које домаћин уписује у URL. */
export const stanje = <R, O extends string>(model: Model<R, O>): StanjeListe<O> => ({
  criteria: model.criteria,
  sort: model.sort,
  offset: model.offset,
})

// Клик на заглавље: иста колона обрће смер, друга колона креће од растућег. Више колона
// постоји само као почетна вредност — први клик своди сорт на једну.
const sledeciSort = <O extends string>(trenutni: ReadonlyArray<Sort<O>>, kolona: O): ReadonlyArray<Sort<O>> => {
  const prva = trenutni[0]
  const obrni = prva !== undefined && prva[0] === kolona && prva[1] === 'ASC'
  return [[kolona, obrni ? 'DESC' : 'ASC']]
}

export const update = <R, O extends string, C>(
  konfiguracija: Konfiguracija<R, O, C>,
  msg: Msg<R, O>,
  model: Model<R, O>,
): [Model<R, O>, Cmd.Cmd<Msg<R, O>>, Ishod<R>] => {
  type Rezultat = [Model<R, O>, Cmd.Cmd<Msg<R, O>>, Ishod<R>]
  const nastavi = (m: Model<R, O>, cmd: Cmd.Cmd<Msg<R, O>> = Cmd.none): Rezultat => [m, cmd, nastaviIshod<R>()]
  const promena = (m: Model<R, O>): Rezultat => [m, Cmd.none, stanjePromenjeno<R>()]

  switch (msg._tag) {
    // Одговор старијег захтева се одбацује: корисник је у међувремену већ тражио друго.
    case 'Primljeno':
      return msg.seq === model.seq ? nastavi({ ...model, podaci: ucitanoIz(msg.odgovor) }) : nastavi(model)

    case 'NijeUspelo':
      return msg.seq === model.seq
        ? nastavi({ ...model, podaci: { _tag: 'Greska', error: msg.error } })
        : nastavi(model)

    // Нов сорт увек враћа на прву страну — иначе би корисник гледао двадесети ред новог редоследа.
    case 'Sortiraj':
      return promena({ ...model, sort: sledeciSort(model.sort, msg.kolona), offset: 0 })

    case 'PromeniStranu':
      return promena({ ...model, offset: msg.offset })

    case 'PrimeniKriterijume':
      return promena({ ...model, criteria: msg.criteria, offset: 0 })

    // Освежавање не мења стање, па не иде кроз URL — само поновни захтев.
    case 'Osvezi': {
      const [m, cmd] = posalji(konfiguracija, model)
      return nastavi(m, cmd)
    }

    case 'Izaberi':
      return nastavi({ ...model, izabrani: msg.red })

    case 'Otvori':
      return [{ ...model, izabrani: msg.red }, Cmd.none, otvoren(msg.red)]
  }
}
