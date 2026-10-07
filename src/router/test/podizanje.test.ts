// @vitest-environment happy-dom
import { Chunk, Effect, Option, Schema, Stream } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import { afterEach, describe, expect, it } from 'vitest'
import { SESSION_KEY, Session } from '../../auth/session'
import { FUNKCIONALNOSTI } from '../../auth/types'
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

const SAT = 60 * 60 * 1000

const session = (istek: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [...FUNKCIONALNOSTI],
  istek,
})

const zapamti = (s: Session): void =>
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(Schema.encodeSync(Session)(s)))

const postaviKolacic = (): void => {
  document.cookie = 'XSRF-TOKEN=abc'
}

const skloniKolacic = (): void => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

const podigni = async (): Promise<Msg> => {
  const poruke = await Effect.runPromise(Stream.runCollect(init(location)[1]))
  return Chunk.toReadonlyArray(poruke)[0]!
}

const ucitanaSesija = (msg: Msg): Option.Option<Session> => {
  if (msg._tag !== 'SessionLoaded') throw new Error(`ocekivan SessionLoaded, a stigao ${msg._tag}`)
  return msg.session
}

afterEach(() => {
  window.localStorage.clear()
  skloniKolacic()
})

describe('podizanje aplikacije', () => {
  it('ziva sesija uz kolacic se preuzima', async () => {
    zapamti(session(Date.now() + SAT))
    postaviKolacic()
    expect(Option.isSome(ucitanaSesija(await podigni()))).toBe(true)
  })

  // Kolacici imaju rok i pregledac ih sam brise, a localStorage nema rok i niko ga ne cisti.
  it('bez kolacica se zapamcena sesija ne koristi', async () => {
    zapamti(session(Date.now() + SAT))
    expect(Option.isNone(ucitanaSesija(await podigni()))).toBe(true)
  })

  // Inace bi se ekran iscrtao i ispalio zahtev pre nego sto otkucaj istek-sesije stigne.
  it('istekla sesija se ne preuzima ni sa kolacicem', async () => {
    zapamti(session(Date.now() - 1))
    postaviKolacic()
    expect(Option.isNone(ucitanaSesija(await podigni()))).toBe(true)
  })

  it('bez zapamcene sesije se krece od prijave', async () => {
    postaviKolacic()
    expect(Option.isNone(ucitanaSesija(await podigni()))).toBe(true)
  })
})
