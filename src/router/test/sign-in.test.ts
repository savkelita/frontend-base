import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { PERMISSIONS, type Permission } from '../../auth/types'
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

const session = (permissions: ReadonlyArray<Permission> = PERMISSIONS): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: permissions,
  expiration: Number.MAX_SAFE_INTEGER,
})

const withoutSession = (pathname: string): Model =>
  update(sessionLoaded(Option.none()), Model.Initializing({ location: location(pathname) }))[0]

const screen = (model: Model): string => (model._tag === 'Authenticated' ? model.screen._tag : model._tag)

const signIn = (anonymous: Model, rights?: ReadonlyArray<Permission>): Model =>
  update(login(loginSucceeded(session(rights))), anonymous)[0]

describe('prijava vraca na trazenu adresu', () => {
  it('adresa otvorena bez sesije se pamti kroz prijavu', () => {
    expect(screen(signIn(withoutSession('/sifarnici/vozaci')))).toBe('VozaciScreen')
    expect(screen(signIn(withoutSession('/evidencija-vozila/vozila')))).toBe('VozilaScreen')
  })

  it('sa pocetne se i dalje stize na pocetnu', () => {
    expect(screen(signIn(withoutSession('/')))).toBe('HomeScreen')
  })

  it('zapamcena adresa i dalje trazi pravo', () => {
    expect(screen(signIn(withoutSession('/sifarnici/vozaci'), []))).toBe('UnauthorizedScreen')
  })

  it('nepoznata adresa ostaje nepoznata i after prijave', () => {
    expect(screen(signIn(withoutSession('/nema/ovoga')))).toBe('NotFoundScreen')
  })
})

describe('odjava cuva mesto', () => {
  const signedInAt = (pathname: string): Model =>
    update(sessionLoaded(Option.some(session())), Model.Initializing({ location: location(pathname) }))[0]

  it('after odjave i nove prijave korisnik se vraca gde je bio', () => {
    const [anonymous] = update(logout(), signedInAt('/sifarnici/vozaci'))
    expect(anonymous._tag).toBe('Anonymous')
    expect(screen(signIn(anonymous))).toBe('VozaciScreen')
  })
})

describe('adresa se prati i dok nema sesije', () => {
  it('promena adrese pomera i cilj prijave', () => {
    const anonymous = withoutSession('/sifarnici/vozaci')
    const [after] = update(urlChanged(location('/evidencija-vozila/vozila')), anonymous)
    expect(screen(signIn(after))).toBe('VozilaScreen')
  })

  it('prijava se i dalje prikazuje, ma sta stajalo u adresi', () => {
    const [after] = update(urlChanged(location('/evidencija-vozila/vozila')), withoutSession('/'))
    expect(after._tag).toBe('Anonymous')
  })
})
