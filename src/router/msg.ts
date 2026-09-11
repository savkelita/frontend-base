import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type * as Navigation from 'tea-effect/Navigation'
import type { SesijaOdgovor } from '../auth/api'
import type * as SesijaUnit from '../auth/sesija'
import type * as Login from '../login'
import type * as Nav from '../navigation'
import type { Pismo } from '../common/strings'
import type { ScreenMsg } from './screen-msg'

export type Msg = Data.TaggedEnum<{
  UrlRequested: { readonly request: Navigation.UrlRequest }
  UrlChanged: { readonly location: Navigation.Location }
  Screen: { readonly screenMsg: ScreenMsg }
  Navigation: { readonly navMsg: Nav.Msg }
  /** Одговор на `tekucaSesija` при дизању апликације. */
  SesijaPotvrdjena: { readonly odgovor: SesijaOdgovor }
  SesijaNijePotvrdjena: { readonly error: Http.HttpError }
  Login: { readonly loginMsg: Login.Msg }
  Sesija: { readonly sesijaMsg: SesijaUnit.Msg }
  Logout: {}
  PromeniPismo: { readonly pismo: Pismo }
}>

export const Msg = Data.taggedEnum<Msg>()

export const urlRequested = (request: Navigation.UrlRequest): Msg => Msg.UrlRequested({ request })
export const urlChanged = (location: Navigation.Location): Msg => Msg.UrlChanged({ location })
export const screen = (screenMsg: ScreenMsg): Msg => Msg.Screen({ screenMsg })
export const navigation = (navMsg: Nav.Msg): Msg => Msg.Navigation({ navMsg })
export const sesijaPotvrdjena = (odgovor: SesijaOdgovor): Msg => Msg.SesijaPotvrdjena({ odgovor })
export const sesijaNijePotvrdjena = (error: Http.HttpError): Msg => Msg.SesijaNijePotvrdjena({ error })
export const login = (loginMsg: Login.Msg): Msg => Msg.Login({ loginMsg })
export const sesija = (sesijaMsg: SesijaUnit.Msg): Msg => Msg.Sesija({ sesijaMsg })
export const logout = (): Msg => Msg.Logout()
export const promeniPismo = (pismo: Pismo): Msg => Msg.PromeniPismo({ pismo })
