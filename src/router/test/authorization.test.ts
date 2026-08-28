import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { FUNKCIONALNOSTI, type Funkcionalnost } from '../../auth/types'
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

const session = (funkcionalnosti: ReadonlyArray<Funkcionalnost>, istek = Number.MAX_SAFE_INTEGER): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'pera@x.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti,
  istek,
})

const ekran = (funkcionalnosti: ReadonlyArray<Funkcionalnost>, pathname: string): string => {
  const [model] = update(
    sessionLoaded(Option.some(session(funkcionalnosti))),
    Model.Initializing({ location: location(pathname) }),
  )
  return model._tag === 'Authenticated' ? model.screen._tag : model._tag
}

describe('ruta trazi funkcionalnost', () => {
  it('sa pravom se otvara ekran', () => {
    expect(ekran(['PretragaVozaca'], '/sifarnici/vozaci')).toBe('VozaciScreen')
    expect(ekran(['PretragaVozila'], '/evidencija-vozila/vozila')).toBe('VozilaScreen')
  })

  // Meni i dugmad su udobnost; ovo je jedina prepreka za rucno ukucanu adresu.
  it('bez prava se ne otvara, ma sta stajalo u adresi', () => {
    expect(ekran([], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
    expect(ekran([], '/evidencija-vozila/vozila')).toBe('UnauthorizedScreen')
  })

  it('pravo za jedan ekran ne otvara drugi', () => {
    expect(ekran(['PretragaVozaca'], '/evidencija-vozila/vozila')).toBe('UnauthorizedScreen')
    expect(ekran(['PretragaVozila'], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
  })

  it('pocetna ne trazi nista', () => {
    expect(ekran([], '/')).toBe('HomeScreen')
  })

  it('nepoznata adresa je 404, a ne 401', () => {
    expect(ekran([...FUNKCIONALNOSTI], '/nema/ovoga')).toBe('NotFoundScreen')
  })
})

describe('promena adrese prolazi kroz istu proveru', () => {
  const prijavljen = (funkcionalnosti: ReadonlyArray<Funkcionalnost>): Model =>
    update(sessionLoaded(Option.some(session(funkcionalnosti))), Model.Initializing({ location: location('/') }))[0]

  const posleSkoka = (funkcionalnosti: ReadonlyArray<Funkcionalnost>, pathname: string): string => {
    const [model] = update(urlChanged(location(pathname)), prijavljen(funkcionalnosti))
    return model._tag === 'Authenticated' ? model.screen._tag : model._tag
  }

  it('bez prava ni skok sa pocetne ne otvara ekran', () => {
    expect(posleSkoka([], '/sifarnici/vozaci')).toBe('UnauthorizedScreen')
  })

  it('sa pravom otvara', () => {
    expect(posleSkoka(['PretragaVozaca'], '/sifarnici/vozaci')).toBe('VozaciScreen')
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

  it('poruka ekrana bez sesije ne radi nista', () => {
    const anoniman = update(sessionLoaded(Option.none()), Model.Initializing({ location: location('/') }))[0]
    const [model] = update(urlChanged(location('/sifarnici/vozaci')), anoniman)
    expect(model).toBe(anoniman)
  })
})
