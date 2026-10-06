import { Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import * as Sub from 'tea-effect/Sub'
import { describe, expect, it } from 'vitest'
import type { Session } from '../../auth/session'
import { FUNKCIONALNOSTI } from '../../auth/types'
import { unloadGuard } from '../../common/form/unload'
import { EMPTY } from '../../sifarnici/vozac/kreiranje/model'
import { changed } from '../../sifarnici/vozac/kreiranje/msg'
import { kreiranjeMsg, startKreiranje } from '../../sifarnici/vozac/pretraga/msg'
import { subscriptions, update } from '../index'
import { Model } from '../model'
import { screen, sessionLoaded } from '../msg'
import { vozaciMsg } from '../screen-msg'

const location: Navigation.Location = {
  pathname: '/sifarnici/vozaci',
  search: '',
  hash: '',
  href: '/sifarnici/vozaci',
  origin: '',
  state: null,
}

const session: Session = {
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [...FUNKCIONALNOSTI],
  istek: Date.now() + 60 * 60 * 1000,
}

const naVozacima = update(sessionLoaded(Option.some(session)), Model.Initializing({ location }))[0]

const posle = (msg: Parameters<typeof vozaciMsg>[0], model: Model): Model => update(screen(vozaciMsg(msg)), model)[0]

const CUVAR = Sub.getSubEntries(unloadGuard(true))[0]!.key

const cuva = (model: Model): boolean => Sub.getSubEntries(subscriptions(model)).some(e => e.key === CUVAR)

describe('cuvar nesacuvanih izmena stize do rutera', () => {
  it('bez otvorenog dijaloga se odlazi bez pitanja', () => {
    expect(cuva(naVozacima)).toBe(false)
  })

  it('netaknut dijalog ne zadrzava korisnika', () => {
    expect(cuva(posle(startKreiranje(), naVozacima))).toBe(false)
  })

  it('unet podatak zadrzava korisnika', () => {
    const otkucano = posle(kreiranjeMsg(changed({ ...EMPTY, ime: 'Mika' })), posle(startKreiranje(), naVozacima))
    expect(cuva(otkucano)).toBe(true)
  })

  it('zatvaranje dijaloga ga ponovo pusta', () => {
    const otkucano = posle(kreiranjeMsg(changed({ ...EMPTY, ime: 'Mika' })), posle(startKreiranje(), naVozacima))
    expect(cuva(posle(startKreiranje(), otkucano))).toBe(false)
  })
})
