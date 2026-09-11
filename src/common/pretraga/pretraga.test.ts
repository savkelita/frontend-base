import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type { AnyCriteria, PretragaRequest, PretragaResponse } from '../platform'
import { nijeUspelo, primljeno, promeniStranu, sortiraj, izaberi, otvori, osvezi, primeniKriterijume } from './msg'
import { redovi, ukupno } from './model'
import { init, stanje, update } from './index'
import type { Konfiguracija } from './index'

type Red = { readonly id: number; readonly sifra: string }
type Kolona = 'sifra' | 'naziv'

const Red = S.Struct({ id: S.Number, sifra: S.String })

// Рута памти последњи захтев, да тест може да провери шта је стварно отишло.
let poslednji: PretragaRequest<AnyCriteria, Kolona> | undefined
const konfiguracija: Konfiguracija<Red, Kolona> = {
  ruta: zahtev => {
    poslednji = zahtev
    return Http.get(
      '/x',
      Http.expectJson(S.Struct({ total: S.Number, offset: S.NullOr(S.Number), podaci: S.Array(Red) })),
    )
  },
  limit: 10,
}

const odgovor = (redoviUlaz: ReadonlyArray<Red>, total = redoviUlaz.length): PretragaResponse<Red> => ({
  total,
  offset: 0,
  podaci: redoviUlaz,
})

const A: Red = { id: 1, sifra: 'A' }
const B: Red = { id: 2, sifra: 'B' }

const otvorena = () => init(konfiguracija, { criteria: {}, sort: [['sifra', 'ASC']], offset: 0 })

describe('дизање листе', () => {
  it('одмах шаље претрагу са стањем из URL-а', () => {
    const [model, cmd] = init(konfiguracija, { criteria: { stanje: 'AKTIVAN' }, sort: [['naziv', 'DESC']], offset: 20 })
    expect(cmd).not.toBe(Cmd.none)
    expect(poslednji).toEqual({ limit: 10, offset: 20, criteria: { stanje: 'AKTIVAN' }, sort: [['naziv', 'DESC']] })
    expect(model.podaci._tag).toBe('Ucitava')
  })
})

describe('одговори', () => {
  it('одговор текућег захтева пуни табелу', () => {
    const [m] = otvorena()
    const [posle] = update(konfiguracija, primljeno(m.seq, odgovor([A, B], 42)), m)
    expect(redovi(posle.podaci)).toEqual([A, B])
    expect(ukupno(posle.podaci)).toBe(42)
  })

  // Корисник брзо кликће по странама; одговор првог клика не сме да прегази трећи.
  it('одговор старијег захтева се одбацује', () => {
    const [m] = otvorena()
    const [posle] = update(konfiguracija, primljeno(m.seq - 1, odgovor([A])), m)
    expect(posle.podaci._tag).toBe('Ucitava')
  })

  it('грешка старијег захтева се такође одбацује', () => {
    const [m] = otvorena()
    const [posle] = update(konfiguracija, nijeUspelo(m.seq - 1, { _tag: 'Timeout' }), m)
    expect(posle.podaci._tag).toBe('Ucitava')
  })

  it('претходна страна остаје на екрану док стиже нова', () => {
    const [m] = otvorena()
    const ucitano = update(konfiguracija, primljeno(m.seq, odgovor([A, B], 42)), m)[0]
    const [uToku] = update(konfiguracija, osvezi(), ucitano)
    expect(uToku.podaci._tag).toBe('Ucitava')
    expect(redovi(uToku.podaci)).toEqual([A, B])
  })
})

describe('сортирање', () => {
  it('клик на исту колону обрће смер', () => {
    const [m] = otvorena()
    const [posle, , ishod] = update(konfiguracija, sortiraj('sifra'), m)
    expect(posle.sort).toEqual([['sifra', 'DESC']])
    expect(ishod._tag).toBe('StanjePromenjeno')
  })

  it('клик на другу колону креће од растућег', () => {
    const [m] = otvorena()
    const [posle] = update(konfiguracija, sortiraj('naziv'), m)
    expect(posle.sort).toEqual([['naziv', 'ASC']])
  })

  // Више колона постоји само као почетна вредност; први клик своди на једну.
  it('вишеколонски почетни сорт се првим кликом своди на једну колону', () => {
    const [m] = init(konfiguracija, {
      criteria: {},
      sort: [
        ['sifra', 'ASC'],
        ['naziv', 'DESC'],
      ],
      offset: 0,
    })
    expect(update(konfiguracija, sortiraj('naziv'), m)[0].sort).toEqual([['naziv', 'ASC']])
  })

  it('нов сорт враћа на прву страну', () => {
    const [m] = init(konfiguracija, { criteria: {}, sort: [], offset: 40 })
    expect(update(konfiguracija, sortiraj('sifra'), m)[0].offset).toBe(0)
  })
})

describe('страничење и критеријуми', () => {
  it('промена стране мења само померај и јавља домаћину', () => {
    const [m] = otvorena()
    const [posle, cmd, ishod] = update(konfiguracija, promeniStranu(30), m)
    expect(posle.offset).toBe(30)
    // Захтев шаље тек рутер, кроз нов URL — овде нема команде.
    expect(cmd).toBe(Cmd.none)
    expect(ishod._tag).toBe('StanjePromenjeno')
  })

  it('нови критеријуми враћају на прву страну', () => {
    const [m] = init(konfiguracija, { criteria: {}, sort: [], offset: 40 })
    const [posle] = update(konfiguracija, primeniKriterijume({ naziv: 'X' }), m)
    expect(posle.criteria).toEqual({ naziv: 'X' })
    expect(posle.offset).toBe(0)
  })

  it('освежавање не мења стање него само поново пита сервер', () => {
    const [m] = otvorena()
    const [posle, cmd, ishod] = update(konfiguracija, osvezi(), m)
    expect(cmd).not.toBe(Cmd.none)
    expect(ishod._tag).toBe('Nastavi')
    expect(stanje(posle)).toEqual(stanje(m))
  })
})

describe('избор реда', () => {
  it('избор остаје у моделу', () => {
    const [m] = otvorena()
    expect(update(konfiguracija, izaberi(A), m)[0].izabrani).toEqual(A)
  })

  it('двоклик јавља домаћину који је ред отворен', () => {
    const [m] = otvorena()
    const [, , ishod] = update(konfiguracija, otvori(B), m)
    expect(ishod).toEqual({ _tag: 'Otvoren', red: B })
  })
})
