import { Option } from 'effect'
import * as LocalStorage from 'tea-effect/LocalStorage'
import type * as Navigation from 'tea-effect/Navigation'
import * as Sub from 'tea-effect/Sub'
import { describe, expect, it } from 'vitest'
import { SESSION_KEY, Session } from '../../auth/session'
import { PERMISSIONS } from '../../auth/types'
import { subscriptions, update } from '../index'
import { Model } from '../model'
import { sessionChanged, sessionLoaded } from '../msg'

const location: Navigation.Location = {
  pathname: '/sifarnici/vozaci',
  search: '',
  hash: '',
  href: '/sifarnici/vozaci',
  origin: '',
  state: null,
}

const session = (id: number, ime: string, uloga: Session['uloga'] = 'ADMINISTRATOR'): Session => ({
  korisnik: { id, ime, prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga,
  funkcionalnosti: [...PERMISSIONS],
  expiration: Date.now() + 60 * 60 * 1000,
})

const PERA = session(1, 'Pera')

const signedIn = (s: Session = PERA): Model =>
  update(sessionLoaded(Option.some(s)), Model.Initializing({ location }))[0]

const anonymous = (): Model => update(sessionLoaded(Option.none()), Model.Initializing({ location }))[0]

const SYNC_KEY = Sub.getSubEntries(
  LocalStorage.onChange(SESSION_KEY, Session, {
    onSuccess: sessionChanged,
    onError: () => sessionChanged(Option.none()),
  }),
)[0]!.key

const listens = (model: Model): boolean => Sub.getSubEntries(subscriptions(model)).some(entry => entry.key === SYNC_KEY)

const auth = (model: Model) => {
  if (model._tag !== 'Authenticated') throw new Error(`ocekivan Authenticated, a stigao ${model._tag}`)
  return model
}

describe('sesija promenjena u drugom tabu', () => {
  it('odjava u drugom tabu vraca na prijavu', () => {
    const [model] = update(sessionChanged(Option.none()), signedIn())
    expect(model._tag).toBe('Anonymous')
  })

  it('anoniman tab ne reaguje na brisanje sesije', () => {
    const before = anonymous()
    expect(update(sessionChanged(Option.none()), before)[0]).toBe(before)
  })

  it('prijava drugog korisnika menja identitet', () => {
    const mika = session(2, 'Mika')
    const [model] = update(sessionChanged(Option.some(mika)), signedIn())
    expect(auth(model).session.korisnik.id).toBe(2)
  })

  it('ista osoba u drugoj ulozi se tretira kao drugi identitet', () => {
    const otherRole = session(1, 'Pera', 'REFERENT')
    const [model] = update(sessionChanged(Option.some(otherRole)), signedIn())
    expect(auth(model).session.uloga).toBe('REFERENT')
  })

  it('isti identitet samo osvezi sesiju, bez rusenja ekrana', () => {
    const before = auth(signedIn())
    const extended = { ...PERA, expiration: PERA.expiration + 60 * 1000 }
    const [model] = update(sessionChanged(Option.some(extended)), before)
    expect(auth(model).session.expiration).toBe(extended.expiration)
    expect(auth(model).screen).toBe(before.screen)
  })

  it('anoniman tab se prijavi kada se drugi prijavi', () => {
    const [model] = update(sessionChanged(Option.some(PERA)), anonymous())
    expect(model._tag).toBe('Authenticated')
  })

  it('osluskuje se u svakom stanju rutera', () => {
    for (const model of [Model.Initializing({ location }), anonymous(), signedIn()]) {
      expect(listens(model), model._tag).toBe(true)
    }
  })
})
