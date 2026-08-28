import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { FUNKCIONALNOSTI, type Funkcionalnost } from '../../auth/types'
import { loginSucceeded } from '../../login/msg'
import { update } from '../index'
import { Model } from '../model'
import { login, logout, sessionLoaded, urlChanged } from '../msg'

const location = (pathname: string): Navigation.Location => ({
  pathname,
  search: '',
  hash: '',
  href: pathname,
  origin: '',
  state: null,
})

const session = (funkcionalnosti: ReadonlyArray<Funkcionalnost> = FUNKCIONALNOSTI): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti,
  istek: Number.MAX_SAFE_INTEGER,
})

const bezSesije = (pathname: string): Model =>
  update(sessionLoaded(Option.none()), Model.Initializing({ location: location(pathname) }))[0]

const ekran = (model: Model): string => (model._tag === 'Authenticated' ? model.screen._tag : model._tag)

const prijaviSe = (anoniman: Model, prava?: ReadonlyArray<Funkcionalnost>): Model =>
  update(login(loginSucceeded(session(prava))), anoniman)[0]

describe('prijava vraca na trazenu adresu', () => {
  // Poslat link otvoren bez sesije: prijava mora da nastavi tamo, a ne da odvede na pocetnu.
  it('adresa otvorena bez sesije se pamti kroz prijavu', () => {
    expect(ekran(prijaviSe(bezSesije('/sifarnici/vozaci')))).toBe('VozaciScreen')
    expect(ekran(prijaviSe(bezSesije('/evidencija-vozila/vozila')))).toBe('VozilaScreen')
  })

  it('sa pocetne se i dalje stize na pocetnu', () => {
    expect(ekran(prijaviSe(bezSesije('/')))).toBe('HomeScreen')
  })

  it('zapamcena adresa i dalje trazi pravo', () => {
    expect(ekran(prijaviSe(bezSesije('/sifarnici/vozaci'), []))).toBe('UnauthorizedScreen')
  })

  it('nepoznata adresa ostaje nepoznata i posle prijave', () => {
    expect(ekran(prijaviSe(bezSesije('/nema/ovoga')))).toBe('NotFoundScreen')
  })
})

describe('odjava cuva mesto', () => {
  const prijavljenNa = (pathname: string): Model =>
    update(sessionLoaded(Option.some(session())), Model.Initializing({ location: location(pathname) }))[0]

  it('posle odjave i nove prijave korisnik se vraca gde je bio', () => {
    const [anoniman] = update(logout(), prijavljenNa('/sifarnici/vozaci'))
    expect(anoniman._tag).toBe('Anonymous')
    expect(ekran(prijaviSe(anoniman))).toBe('VozaciScreen')
  })
})

describe('adresa se prati i dok nema sesije', () => {
  // Bez ovoga bi Nazad u pregledacu razisao zapamcenu adresu sa onim sto pise u traci.
  it('promena adrese pomera i cilj prijave', () => {
    const anoniman = bezSesije('/sifarnici/vozaci')
    const [posle] = update(urlChanged(location('/evidencija-vozila/vozila')), anoniman)
    expect(ekran(prijaviSe(posle))).toBe('VozilaScreen')
  })

  it('prijava se i dalje prikazuje, ma sta stajalo u adresi', () => {
    const [posle] = update(urlChanged(location('/evidencija-vozila/vozila')), bezSesije('/'))
    expect(posle._tag).toBe('Anonymous')
  })
})
