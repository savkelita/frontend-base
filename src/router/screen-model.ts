import { Data } from 'effect'
import type * as VozilaPretraga from '../evidencija-vozila/vozilo/pretraga'
import type * as Home from '../home'
import type * as VozaciPretraga from '../sifarnici/vozac/pretraga'

export type ScreenModel = Data.TaggedEnum<{
  HomeScreen: { readonly model: Home.Model }
  VozaciScreen: { readonly model: VozaciPretraga.Model }
  VozilaScreen: { readonly model: VozilaPretraga.Model }
  NotFoundScreen: { readonly path: string }
  UnauthorizedScreen: { readonly path: string }
}>

export const ScreenModel = Data.taggedEnum<ScreenModel>()

export const homeScreen = (model: Home.Model): ScreenModel => ScreenModel.HomeScreen({ model })

export const vozaciScreen = (model: VozaciPretraga.Model): ScreenModel => ScreenModel.VozaciScreen({ model })

export const vozilaScreen = (model: VozilaPretraga.Model): ScreenModel => ScreenModel.VozilaScreen({ model })

export const notFoundScreen = (path: string): ScreenModel => ScreenModel.NotFoundScreen({ path })
export const unauthorizedScreen = (path: string): ScreenModel => ScreenModel.UnauthorizedScreen({ path })
