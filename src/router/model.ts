import { Data } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import type { Session } from '../auth/session'
import type * as SessionExpiration from '../auth/session-expiration'
import type * as Login from '../login'
import type * as Nav from '../navigation'
import type { ScreenModel } from './screen-model'

export type Model = Data.TaggedEnum<{
  Initializing: { readonly location: Navigation.Location }
  Anonymous: { readonly location: Navigation.Location; readonly login: Login.Model }
  Authenticated: {
    readonly session: Session
    readonly location: Navigation.Location
    readonly screen: ScreenModel
    readonly navigation: Nav.Model
    readonly sessionExpiration: SessionExpiration.Model
  }
}>

export const Model = Data.taggedEnum<Model>()
