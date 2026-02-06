import { Data } from 'effect'
import type * as Home from '../home'
import type * as Products from '../products'

export type ScreenMsg = Data.TaggedEnum<{
  HomeMsg: { readonly msg: Home.Msg }
  ProductsMsg: { readonly msg: Products.Msg }
}>

export const ScreenMsg = Data.taggedEnum<ScreenMsg>()

export const homeMsg = (msg: Home.Msg): ScreenMsg => ScreenMsg.HomeMsg({ msg })
export const productsMsg = (msg: Products.Msg): ScreenMsg => ScreenMsg.ProductsMsg({ msg })
