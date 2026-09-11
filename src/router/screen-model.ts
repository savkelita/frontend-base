import { Data } from 'effect'
import type * as ArtikalPregled from '../artikal/pregled'
import type * as ArtikalPretraga from '../artikal/pretraga'
import type * as Home from '../home'
import type * as OtpremnicaStavke from '../otpremnica/stavke'

export type ScreenModel = Data.TaggedEnum<{
  HomeScreen: { readonly model: Home.Model }
  OtpremnicaStavkeScreen: { readonly model: OtpremnicaStavke.Model }
  ArtikliScreen: { readonly model: ArtikalPretraga.Model }
  ArtikalScreen: { readonly model: ArtikalPregled.Model }
  NotFoundScreen: { readonly path: string }
  UnauthorizedScreen: { readonly path: string }
}>

export const ScreenModel = Data.taggedEnum<ScreenModel>()

export const homeScreen = (model: Home.Model): ScreenModel => ScreenModel.HomeScreen({ model })
export const otpremnicaStavkeScreen = (model: OtpremnicaStavke.Model): ScreenModel =>
  ScreenModel.OtpremnicaStavkeScreen({ model })
export const artikliScreen = (model: ArtikalPretraga.Model): ScreenModel => ScreenModel.ArtikliScreen({ model })
export const artikalScreen = (model: ArtikalPregled.Model): ScreenModel => ScreenModel.ArtikalScreen({ model })
export const notFoundScreen = (path: string): ScreenModel => ScreenModel.NotFoundScreen({ path })
export const unauthorizedScreen = (path: string): ScreenModel => ScreenModel.UnauthorizedScreen({ path })
