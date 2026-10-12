// @vitest-environment happy-dom
import { Chunk, Effect, Option, Schema, Stream } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { afterEach, describe, expect, it } from 'vitest'
import { SESSION_KEY, Session } from '../../auth/session'
import { PERMISSIONS } from '../../auth/types'
import { init } from '../index'
import type { Msg } from '../msg'

const location: Navigation.Location = {
  pathname: '/',
  search: '',
  hash: '',
  href: '/',
  origin: '',
  state: null,
}

const HOUR = 60 * 60 * 1000

const session = (expiration: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [...PERMISSIONS],
  expiration,
})

const remember = (s: Session): void =>
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(Schema.encodeSync(Session)(s)))

const setCookie = (): void => {
  document.cookie = 'XSRF-TOKEN=abc'
}

const clearCookie = (): void => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

const boot = async (): Promise<Msg> => {
  const messages = await Effect.runPromise(Stream.runCollect(init(location)[1]))
  return Chunk.toReadonlyArray(messages)[0]!
}

const loadedSession = (msg: Msg): Option.Option<Session> => {
  if (msg._tag !== 'SessionLoaded') throw new Error(`ocekivan SessionLoaded, a stigao ${msg._tag}`)
  return msg.session
}

afterEach(() => {
  window.localStorage.clear()
  clearCookie()
})

describe('podizanje aplikacije', () => {
  it('ziva sesija uz kolacic se preuzima', async () => {
    remember(session(Date.now() + HOUR))
    setCookie()
    expect(Option.isSome(loadedSession(await boot()))).toBe(true)
  })

  it('bez kolacica se zapamcena sesija ne koristi', async () => {
    remember(session(Date.now() + HOUR))
    expect(Option.isNone(loadedSession(await boot()))).toBe(true)
  })

  it('istekla sesija se ne preuzima ni sa kolacicem', async () => {
    remember(session(Date.now() - 1))
    setCookie()
    expect(Option.isNone(loadedSession(await boot()))).toBe(true)
  })

  it('bez zapamcene sesije se krece od prijave', async () => {
    setCookie()
    expect(Option.isNone(loadedSession(await boot()))).toBe(true)
  })
})
