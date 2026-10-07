import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { Msg as ExpirationMsg } from '../../auth/session-expiration'
import { update } from '../index'
import { Model } from '../model'
import { sessionExpiration, sessionLoaded } from '../msg'

const MINUTE = 60 * 1000

const location: Navigation.Location = {
  pathname: '/',
  search: '',
  hash: '',
  href: '/',
  origin: '',
  state: null,
}

const session = (expiration: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [],
  expiration,
})

const signedIn = (expiration: number): Model =>
  update(sessionLoaded(Option.some(session(expiration))), Model.Initializing({ location }))[0]

const afterTick = (expiration: number, now: number): Model =>
  update(sessionExpiration(ExpirationMsg.Tick({ now })), signedIn(expiration))[0]

describe('istek sesije gasi prijavu', () => {
  it('pre isteka se ostaje prijavljen', () => {
    expect(afterTick(10 * MINUTE, 9 * MINUTE)._tag).toBe('Authenticated')
  })

  it('na istek se korisnik odjavljuje', () => {
    expect(afterTick(10 * MINUTE, 10 * MINUTE)._tag).toBe('Anonymous')
  })

  it('otkucaj pamti vreme dok sesija traje', () => {
    const model = afterTick(10 * MINUTE, 3 * MINUTE)
    expect(model._tag === 'Authenticated' && model.sessionExpiration.now).toStrictEqual(Option.some(3 * MINUTE))
  })

  it('dugme u dijalogu odjavljuje odmah', () => {
    const [model] = update(sessionExpiration(ExpirationMsg.SignOut()), signedIn(10 * MINUTE))
    expect(model._tag).toBe('Anonymous')
  })

  it('bez prijave otkucaj ne radi nista', () => {
    const anonymous = update(sessionLoaded(Option.none()), Model.Initializing({ location }))[0]
    const [model] = update(sessionExpiration(ExpirationMsg.Tick({ now: 1 })), anonymous)
    expect(model).toBe(anonymous)
  })
})
