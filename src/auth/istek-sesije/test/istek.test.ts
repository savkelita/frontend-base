import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../session'
import { PRAG_SEKUNDI, initial, istekla, preostalo, update, upozorava, upozorenje } from '../index'
import { Msg } from '../msg'

const MINUT = 60 * 1000

const sesija = (istek: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [],
  istek,
})

const u = (sada: number) => ({ sada: Option.some(sada) })

describe('preostalo vreme', () => {
  it('racuna se u sekundama do isteka', () => {
    expect(preostalo(sesija(10 * MINUT), u(4 * MINUT))).toStrictEqual(Option.some(6 * 60))
  })

  it('posle isteka je negativno, ne nula', () => {
    expect(preostalo(sesija(MINUT), u(2 * MINUT))).toStrictEqual(Option.some(-60))
  })

  // Pre prvog otkucaja nista nije izmereno, pa se ne sme tvrditi ni da je isteklo ni da nije blizu.
  it('bez otkucaja nema odgovora', () => {
    expect(preostalo(sesija(MINUT), initial)).toStrictEqual(Option.none())
    expect(istekla(sesija(MINUT), initial)).toBe(false)
  })
})

describe('kada se prijavljuje', () => {
  it('cuti dok je iznad praga', () => {
    expect(upozorava(PRAG_SEKUNDI + 1)).toBe(false)
  })

  it('javlja se na samom pragu', () => {
    expect(upozorava(PRAG_SEKUNDI)).toBe(true)
  })

  it('istek je tacno trenutak kraja, ne sekunda posle', () => {
    expect(istekla(sesija(MINUT), u(MINUT - 1000))).toBe(false)
    expect(istekla(sesija(MINUT), u(MINUT))).toBe(true)
  })

  it('kratka sesija ne prijavljuje istek pre nego sto istekne', () => {
    expect(istekla(sesija(30 * 1000), u(0))).toBe(false)
  })
})

describe('tekst upozorenja', () => {
  it.each([
    [PRAG_SEKUNDI, '2 min'],
    [61, '2 min'],
    [90, '2 min'],
  ])('%i sekundi se zaokruzuje navise: %s', (sekundi, ocekivano) => {
    expect(upozorenje(sekundi)).toContain(ocekivano)
  })

  it('ispod minuta ne pominje minute', () => {
    expect(upozorenje(59)).toBe('Vasa sesija istice za manje od minuta')
    expect(upozorenje(1)).toBe('Vasa sesija istice za manje od minuta')
  })

  it('nula i manje znaci da je gotovo', () => {
    expect(upozorenje(0)).toBe('Vasa sesija je istekla')
    expect(upozorenje(-30)).toBe('Vasa sesija je istekla')
  })
})

describe('otkucaj', () => {
  it('upisuje vreme i ne pravi komandu', () => {
    const [model, cmd] = update(Msg.Otkucaj({ sada: 123 }), initial)
    expect(model.sada).toStrictEqual(Option.some(123))
    expect(cmd).toBe(Cmd.none)
  })

  it('odjava ne dira model — o njoj odlucuje router', () => {
    const [model] = update(Msg.Odjava(), u(5))
    expect(model).toStrictEqual(u(5))
  })
})
