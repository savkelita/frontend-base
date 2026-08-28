import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import { Msg as IstekMsg } from '../../auth/istek-sesije'
import type { Session } from '../../auth/session'
import { update } from '../index'
import { Model } from '../model'
import { istekSesije, sessionLoaded } from '../msg'

const MINUT = 60 * 1000

const location: Navigation.Location = {
  pathname: '/',
  search: '',
  hash: '',
  href: '/',
  origin: '',
  state: null,
}

const session = (istek: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [],
  istek,
})

const prijavljen = (istek: number): Model =>
  update(sessionLoaded(Option.some(session(istek))), Model.Initializing({ location }))[0]

const posleOtkucaja = (istek: number, sada: number): Model =>
  update(istekSesije(IstekMsg.Otkucaj({ sada })), prijavljen(istek))[0]

describe('istek sesije gasi prijavu', () => {
  it('pre isteka se ostaje prijavljen', () => {
    expect(posleOtkucaja(10 * MINUT, 9 * MINUT)._tag).toBe('Authenticated')
  })

  // Sesija se gasi po satu, ne po 401 — isti status znaci i da korisnik nema pravo na taj poziv.
  it('na istek se korisnik odjavljuje', () => {
    expect(posleOtkucaja(10 * MINUT, 10 * MINUT)._tag).toBe('Anonymous')
  })

  it('otkucaj pamti vreme dok sesija traje', () => {
    const model = posleOtkucaja(10 * MINUT, 3 * MINUT)
    expect(model._tag === 'Authenticated' && model.istekSesije.sada).toStrictEqual(Option.some(3 * MINUT))
  })

  it('dugme u dijalogu odjavljuje odmah', () => {
    const [model] = update(istekSesije(IstekMsg.Odjava()), prijavljen(10 * MINUT))
    expect(model._tag).toBe('Anonymous')
  })

  it('bez prijave otkucaj ne radi nista', () => {
    const anoniman = update(sessionLoaded(Option.none()), Model.Initializing({ location }))[0]
    const [model] = update(istekSesije(IstekMsg.Otkucaj({ sada: 1 })), anoniman)
    expect(model).toBe(anoniman)
  })
})
