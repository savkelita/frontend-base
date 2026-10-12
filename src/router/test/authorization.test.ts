import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { PERMISSIONS, type Permission } from '../../auth/types'
import { update } from '../index'
import { Model } from '../model'
import { sessionLoaded, urlChanged } from '../msg'

const location = (pathname: string): Navigation.Location => ({
  pathname,
  search: '',
  hash: '',
  href: pathname,
  origin: '',
  state: null,
})

const session = (permissions: ReadonlyArray<Permission>, expiration = Number.MAX_SAFE_INTEGER): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'pera@x.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: permissions,
  expiration,
})

const screen = (permissions: ReadonlyArray<Permission>, pathname: string): string => {
  const [model] = update(
    sessionLoaded(Option.some(session(permissions))),
    Model.Initializing({ location: location(pathname) }),
  )
  return model._tag === 'Authenticated' ? model.screen._tag : model._tag
}

describe('ruta trazi funkcionalnost', () => {
  it('sa pravom se otvara ekran', () => {
    expect(screen(['PretragaVozaca'], '/sifarnici/vozaci')).toBe('VozaciScreen')
    expect(screen(['PretragaVozila'], '/evidencija-vozila/vozila')).toBe('VozilaScreen')
  })

  it('bez prava se ne otvara, ma sta stajalo u adresi', () => {
    expect(screen([], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
    expect(screen([], '/evidencija-vozila/vozila')).toBe('UnauthorizedScreen')
  })

  it('pravo za jedan ekran ne otvara drugi', () => {
    expect(screen(['PretragaVozaca'], '/evidencija-vozila/vozila')).toBe('UnauthorizedScreen')
    expect(screen(['PretragaVozila'], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
  })

  it('pocetna ne trazi nista', () => {
    expect(screen([], '/')).toBe('HomeScreen')
  })

  it('nepoznata adresa je 404, a ne 401', () => {
    expect(screen([...PERMISSIONS], '/nema/ovoga')).toBe('NotFoundScreen')
  })
})

describe('promena adrese prolazi kroz istu proveru', () => {
  const signedIn = (permissions: ReadonlyArray<Permission>): Model =>
    update(sessionLoaded(Option.some(session(permissions))), Model.Initializing({ location: location('/') }))[0]

  const landsOn = (permissions: ReadonlyArray<Permission>, pathname: string): string => {
    const [model] = update(urlChanged(location(pathname)), signedIn(permissions))
    return model._tag === 'Authenticated' ? model.screen._tag : model._tag
  }

  it('bez prava ni skok sa pocetne ne otvara ekran', () => {
    expect(landsOn([], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
  })

  it('sa pravom otvara', () => {
    expect(landsOn(['PretragaVozaca'], '/sifarnici/vozaci')).toBe('VozaciScreen')
  })
})

describe('bez sesije nema ekrana', () => {
  it('prazan localStorage vodi na prijavu, ne na trazenu adresu', () => {
    const [model] = update(
      sessionLoaded(Option.none()),
      Model.Initializing({ location: location('/sifarnici/vozaci') }),
    )
    expect(model._tag).toBe('Anonymous')
  })

  it('promena adrese bez sesije ne otvara ekran', () => {
    const anonymous = update(sessionLoaded(Option.none()), Model.Initializing({ location: location('/') }))[0]
    const [model] = update(urlChanged(location('/sifarnici/vozaci')), anonymous)
    expect(model._tag).toBe('Anonymous')
  })
})
