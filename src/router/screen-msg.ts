import { Data } from 'effect'
import type * as ArtikalPregled from '../artikal/pregled'
import type * as ArtikalPretraga from '../artikal/pretraga'
import type * as Home from '../home'
import type * as OtpremnicaStavke from '../otpremnica/stavke'

export type ScreenMsg = Data.TaggedEnum<{
  HomeMsg: { readonly msg: Home.Msg }
  OtpremnicaStavkeMsg: { readonly msg: OtpremnicaStavke.Msg }
  ArtikliMsg: { readonly msg: ArtikalPretraga.Msg }
  ArtikalMsg: { readonly msg: ArtikalPregled.Msg }
}>

export const ScreenMsg = Data.taggedEnum<ScreenMsg>()

export const homeMsg = (msg: Home.Msg): ScreenMsg => ScreenMsg.HomeMsg({ msg })
export const otpremnicaStavkeMsg = (msg: OtpremnicaStavke.Msg): ScreenMsg => ScreenMsg.OtpremnicaStavkeMsg({ msg })
export const artikliMsg = (msg: ArtikalPretraga.Msg): ScreenMsg => ScreenMsg.ArtikliMsg({ msg })
export const artikalMsg = (msg: ArtikalPregled.Msg): ScreenMsg => ScreenMsg.ArtikalMsg({ msg })
