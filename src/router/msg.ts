import { Data } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import type * as Nav from '../navigation'
import type { ScreenMsg } from './screen-msg'

export type Msg = Data.TaggedEnum<{
  UrlRequested: { readonly request: Navigation.UrlRequest }
  UrlChanged: { readonly location: Navigation.Location }
  Screen: { readonly screenMsg: ScreenMsg }
  Navigation: { readonly navMsg: Nav.Msg }
}>

export const Msg = Data.taggedEnum<Msg>()

export const urlRequested = (request: Navigation.UrlRequest): Msg => Msg.UrlRequested({ request })
export const urlChanged = (location: Navigation.Location): Msg => Msg.UrlChanged({ location })
export const screen = (screenMsg: ScreenMsg): Msg => Msg.Screen({ screenMsg })
export const navigation = (navMsg: Nav.Msg): Msg => Msg.Navigation({ navMsg })
