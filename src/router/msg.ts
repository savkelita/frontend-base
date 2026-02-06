import { Data, Either, Option } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import type * as LocalStorage from 'tea-effect/LocalStorage'
import type { ApiError } from '../common/http'
import type { Session } from '../auth/session'
import type { RefreshResult } from '../auth/api'
import type * as Login from '../login'
import type * as Nav from '../navigation'
import type { ScreenMsg } from './screen-msg'

export type Msg = Data.TaggedEnum<{
  UrlRequested: { readonly request: Navigation.UrlRequest }
  UrlChanged: { readonly location: Navigation.Location }
  Screen: { readonly screenMsg: ScreenMsg }
  Navigation: { readonly navMsg: Nav.Msg }
  SessionLoaded: { readonly session: Option.Option<Session> }
  SessionLoadError: { readonly error: LocalStorage.LocalStorageError }
  Login: { readonly loginMsg: Login.Msg }
  Logout: {}
  RefreshTick: {}
  RefreshCompleted: { readonly result: Either.Either<RefreshResult, ApiError> }
}>

export const Msg = Data.taggedEnum<Msg>()

export const urlRequested = (request: Navigation.UrlRequest): Msg => Msg.UrlRequested({ request })
export const urlChanged = (location: Navigation.Location): Msg => Msg.UrlChanged({ location })
export const screen = (screenMsg: ScreenMsg): Msg => Msg.Screen({ screenMsg })
export const navigation = (navMsg: Nav.Msg): Msg => Msg.Navigation({ navMsg })
export const sessionLoaded = (session: Option.Option<Session>): Msg => Msg.SessionLoaded({ session })
export const sessionLoadError = (error: LocalStorage.LocalStorageError): Msg => Msg.SessionLoadError({ error })
export const login = (loginMsg: Login.Msg): Msg => Msg.Login({ loginMsg })
export const logout = (): Msg => Msg.Logout()
export const refreshTick = (): Msg => Msg.RefreshTick()
export const refreshCompleted = (result: Either.Either<RefreshResult, ApiError>): Msg =>
  Msg.RefreshCompleted({ result })
