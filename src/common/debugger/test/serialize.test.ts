import { Option } from 'effect'
import * as Jsan from 'jsan'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../error'
import { REDACTED, revive, serialize } from '../serialize'

const exported = (value: unknown): string => Jsan.stringify(value, serialize.replacer, undefined, serialize.options)

const imported = (text: string): unknown => Jsan.parse(text, serialize.reviver)

const field = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[name] : undefined

const inside = (value: unknown): unknown => (Option.isOption(value) && Option.isSome(value) ? value.value : 'nije Some')

describe('izvoz i uvoz loga', () => {
  it('datum ostaje datum, i sam i unutar Option-a', () => {
    const kreiran = new Date(2026, 9, 13, 10, 30)
    const back = imported(exported({ kreiran, promenjen: Option.some(kreiran) }))

    expect(field(back, 'kreiran')).toStrictEqual(kreiran)
    expect(inside(field(back, 'promenjen'))).toStrictEqual(kreiran)
  })

  it('Option se vraca kao Option', () => {
    const back = imported(exported({ ima: Option.some(5), nema: Option.none() }))

    expect(inside(field(back, 'ima'))).toBe(5)
    expect(field(back, 'nema')).toBe(Option.none())
  })

  it('tagovana vrednost se vraca sa istim tagom i poljima', () => {
    const greska = ApiError.UnexpectedStatus({ status: 418 })

    expect(imported(exported(greska))).toEqual({ _tag: 'UnexpectedStatus', status: 418 })
  })

  it('isti objekat na dva mesta unutar Option-a se vraca na oba', () => {
    const vozac = { id: 1, ime: 'Pera' }
    const back = imported(exported({ izabran: Option.some(vozac), prethodni: Option.some(vozac) }))

    expect(inside(field(back, 'izabran'))).toEqual(vozac)
    expect(inside(field(back, 'prethodni'))).toEqual(vozac)
  })

  it('objekat aplikacije sa poljem _id ostaje kakav jeste', () => {
    expect(imported(exported({ _id: 'Vozac', ime: 'Pera' }))).toStrictEqual({ _id: 'Vozac', ime: 'Pera' })
  })
})

describe('lozinka u logu', () => {
  it('ne ulazi u izvoz ni iz forme ni iz poruke koja nosi formu', () => {
    const text = exported({ msg: { loginMsg: { value: { korisnickoIme: 'pera', lozinka: 'tajna' } } } })

    expect(text).not.toContain('tajna')
    expect(text).toContain('pera')
  })

  it('maskira se svako polje cije ime kaze da je lozinka', () => {
    const text = exported({ novaLozinka: 'nova', staraLozinka: 'stara', password: 'pass' })

    expect(text).not.toMatch(/nova"|stara"|pass"/)
    expect(field(imported(text), 'novaLozinka')).toBe(REDACTED)
  })

  it('prazno polje ostaje prazno, da se u logu vidi da lozinka nije uneta', () => {
    expect(field(imported(exported({ lozinka: null })), 'lozinka')).toBeNull()
  })
})

describe('ozivljavanje uvezenog loga', () => {
  it('vraca Option i datum i kad prosirenje parsira bez revivera', () => {
    const kreiran = new Date(2026, 9, 13)
    const back = revive(Jsan.parse(exported({ kreiran, ima: Option.some(5) })))

    expect(field(back, 'kreiran')).toStrictEqual(kreiran)
    expect(inside(field(back, 'ima'))).toBe(5)
  })

  it('datum prezivi izvoz iz panela, koji pise obican JSON', () => {
    const kreiran = new Date(2026, 1, 13, 14, 28, 42)
    const panel = JSON.parse(JSON.stringify(Jsan.parse(exported({ vozilo: { datumKreiranja: kreiran } }))))

    expect(field(field(revive(panel), 'vozilo'), 'datumKreiranja')).toStrictEqual(kreiran)
  })

  it('neispravan datum ostaje neispravan datum', () => {
    const back = field(revive(Jsan.parse(exported({ datum: new Date(Number.NaN) }))), 'datum')

    expect(back instanceof Date && Number.isNaN(back.getTime())).toBe(true)
  })

  it('ziva vrednost aplikacije ostaje isti objekat', () => {
    const value = { korisnickoIme: 'pera', izabran: Option.some({ id: 1 }) }

    expect(revive(value)).toBe(value)
  })
})
