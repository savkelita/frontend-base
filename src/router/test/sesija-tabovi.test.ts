import { Option } from 'effect'
import * as LocalStorage from 'tea-effect/LocalStorage'
import type * as Navigation from 'tea-effect/Navigation'
import * as Sub from 'tea-effect/Sub'
import { describe, expect, it } from 'vitest'
import { SESSION_KEY, Session } from '../../auth/session'
import { FUNKCIONALNOSTI } from '../../auth/types'
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
  funkcionalnosti: [...FUNKCIONALNOSTI],
  istek: Date.now() + 60 * 60 * 1000,
})

const PERA = session(1, 'Pera')

const prijavljen = (s: Session = PERA): Model =>
  update(sessionLoaded(Option.some(s)), Model.Initializing({ location }))[0]

const anoniman = (): Model => update(sessionLoaded(Option.none()), Model.Initializing({ location }))[0]

const SINHRONIZACIJA = Sub.getSubEntries(
  LocalStorage.onChange(SESSION_KEY, Session, {
    onSuccess: sessionChanged,
    onError: () => sessionChanged(Option.none()),
  }),
)[0]!.key

const oslusckuje = (model: Model): boolean =>
  Sub.getSubEntries(subscriptions(model)).some(entry => entry.key === SINHRONIZACIJA)

const auth = (model: Model) => {
  if (model._tag !== 'Authenticated') throw new Error(`ocekivan Authenticated, a stigao ${model._tag}`)
  return model
}

describe('sesija promenjena u drugom tabu', () => {
  it('odjava u drugom tabu vraca na prijavu', () => {
    const [model] = update(sessionChanged(Option.none()), prijavljen())
    expect(model._tag).toBe('Anonymous')
  })

  it('anoniman tab ne reaguje na brisanje sesije', () => {
    const pre = anoniman()
    expect(update(sessionChanged(Option.none()), pre)[0]).toBe(pre)
  })

  it('prijava drugog korisnika menja identitet', () => {
    const mika = session(2, 'Mika')
    const [model] = update(sessionChanged(Option.some(mika)), prijavljen())
    expect(auth(model).session.korisnik.id).toBe(2)
  })

  // Ista osoba sa drugom ulogom ima druga prava, pa ekran mora da se izgradi iznova.
  it('ista osoba u drugoj ulozi se tretira kao drugi identitet', () => {
    const drugaUloga = session(1, 'Pera', 'REFERENT')
    const [model] = update(sessionChanged(Option.some(drugaUloga)), prijavljen())
    expect(auth(model).session.uloga).toBe('REFERENT')
  })

  // Ovo je ono sto ce raditi produzenje sesije: isti korisnik, pomeren istek.
  it('isti identitet samo osvezi sesiju, bez rusenja ekrana', () => {
    const pre = auth(prijavljen())
    const produzena = { ...PERA, istek: PERA.istek + 60 * 1000 }
    const [model] = update(sessionChanged(Option.some(produzena)), pre)
    expect(auth(model).session.istek).toBe(produzena.istek)
    expect(auth(model).screen).toBe(pre.screen)
  })

  it('anoniman tab se prijavi kada se drugi prijavi', () => {
    const [model] = update(sessionChanged(Option.some(PERA)), anoniman())
    expect(model._tag).toBe('Authenticated')
  })

  // Osluskivanje mora da traje i pre prijave, inace anoniman tab nikad ne sazna za tudju prijavu.
  it('osluskuje se u svakom stanju rutera', () => {
    for (const model of [Model.Initializing({ location }), anoniman(), prijavljen()]) {
      expect(oslusckuje(model), model._tag).toBe(true)
    }
  })
})
