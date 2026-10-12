import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../session'
import { WARN_SECONDS, expired, initial, remaining, update, warning, warns } from '../index'
import { Msg } from '../msg'

const MINUTE = 60 * 1000

const session = (expiration: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [],
  expiration,
})

const at = (now: number, hasCookie = true) => ({ now: Option.some(now), hasCookie })

describe('preostalo vreme', () => {
  it('racuna se u sekundama do isteka', () => {
    expect(remaining(session(10 * MINUTE), at(4 * MINUTE))).toStrictEqual(Option.some(6 * 60))
  })

  it('posle isteka je negativno, ne nula', () => {
    expect(remaining(session(MINUTE), at(2 * MINUTE))).toStrictEqual(Option.some(-60))
  })

  it('bez otkucaja nema odgovora', () => {
    expect(remaining(session(MINUTE), initial)).toStrictEqual(Option.none())
    expect(expired(session(MINUTE), initial)).toBe(false)
  })
})

describe('kada se prijavljuje', () => {
  it('cuti dok je iznad praga', () => {
    expect(warns(WARN_SECONDS + 1)).toBe(false)
  })

  it('javlja se na samom pragu', () => {
    expect(warns(WARN_SECONDS)).toBe(true)
  })

  it('istek je tacno trenutak kraja, ne sekunda posle', () => {
    expect(expired(session(MINUTE), at(MINUTE - 1000))).toBe(false)
    expect(expired(session(MINUTE), at(MINUTE))).toBe(true)
  })

  it('kratka sesija ne prijavljuje istek pre nego sto istekne', () => {
    expect(expired(session(30 * 1000), at(0))).toBe(false)
  })
})

describe('tekst upozorenja', () => {
  it.each([
    [WARN_SECONDS, '2 min'],
    [61, '2 min'],
    [90, '2 min'],
  ])('%i sekundi se zaokruzuje navise: %s', (seconds, expected) => {
    expect(warning(seconds)).toContain(expected)
  })

  it('ispod minuta ne pominje minute', () => {
    expect(warning(59)).toBe('Vasa sesija istice za manje od minuta')
    expect(warning(1)).toBe('Vasa sesija istice za manje od minuta')
  })

  it('nula i manje znaci da je gotovo', () => {
    expect(warning(0)).toBe('Vasa sesija je istekla')
    expect(warning(-30)).toBe('Vasa sesija je istekla')
  })
})

describe('otkucaj', () => {
  it('upisuje vreme i ne pravi komandu', () => {
    const [model, cmd] = update(Msg.Tick({ now: 123, hasCookie: true }), initial)
    expect(model.now).toStrictEqual(Option.some(123))
    expect(cmd).toBe(Cmd.none)
  })

  it('odjava ne dira model — o njoj odlucuje router', () => {
    const [model] = update(Msg.SignOut(), at(5))
    expect(model).toStrictEqual(at(5))
  })
})

describe('kolacici', () => {
  it('otkucaj pamti da li su kolacici tu', () => {
    const [model] = update(Msg.Tick({ now: 1, hasCookie: false }), initial)
    expect(model.hasCookie).toBe(false)
  })

  it('pre prvog otkucaja se podrazumeva da jesu, jer je podizanje to vec proverilo', () => {
    expect(initial.hasCookie).toBe(true)
  })
})
