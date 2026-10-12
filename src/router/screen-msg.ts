import { Data } from 'effect'
import type * as VozilaPretraga from '../evidencija-vozila/vozilo/pretraga'
import type * as Home from '../home'
import type * as VozacPregled from '../sifarnici/vozac/pregled'
import type * as VozaciPretraga from '../sifarnici/vozac/pretraga'

export type ScreenMsg = Data.TaggedEnum<{
  HomeMsg: { readonly msg: Home.Msg }
  VozaciMsg: { readonly msg: VozaciPretraga.Msg }
  VozacMsg: { readonly msg: VozacPregled.Msg }
  VozilaMsg: { readonly msg: VozilaPretraga.Msg }
}>

export const ScreenMsg = Data.taggedEnum<ScreenMsg>()

export const homeMsg = (msg: Home.Msg): ScreenMsg => ScreenMsg.HomeMsg({ msg })

export const vozaciMsg = (msg: VozaciPretraga.Msg): ScreenMsg => ScreenMsg.VozaciMsg({ msg })

export const vozacMsg = (msg: VozacPregled.Msg): ScreenMsg => ScreenMsg.VozacMsg({ msg })

export const vozilaMsg = (msg: VozilaPretraga.Msg): ScreenMsg => ScreenMsg.VozilaMsg({ msg })
