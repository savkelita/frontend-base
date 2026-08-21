import { Data } from 'effect'
import type * as Home from '../home'
import type * as VozaciPretraga from '../sifarnici/vozac/pretraga'

export type ScreenMsg = Data.TaggedEnum<{
  HomeMsg: { readonly msg: Home.Msg }
  VozaciMsg: { readonly msg: VozaciPretraga.Msg }
}>

export const ScreenMsg = Data.taggedEnum<ScreenMsg>()

export const homeMsg = (msg: Home.Msg): ScreenMsg => ScreenMsg.HomeMsg({ msg })

export const vozaciMsg = (msg: VozaciPretraga.Msg): ScreenMsg => ScreenMsg.VozaciMsg({ msg })
