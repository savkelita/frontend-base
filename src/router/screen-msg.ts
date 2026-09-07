import { Data } from 'effect'
import type * as Home from '../home'
import type * as Products from '../products'
import type * as ProductCreate from '../products/create'
import type * as OtpremnicaStavke from '../otpremnica/stavke'

export type ScreenMsg = Data.TaggedEnum<{
  HomeMsg: { readonly msg: Home.Msg }
  ProductsMsg: { readonly msg: Products.Msg }
  ProductCreateMsg: { readonly msg: ProductCreate.Msg }
  OtpremnicaStavkeMsg: { readonly msg: OtpremnicaStavke.Msg }
}>

export const ScreenMsg = Data.taggedEnum<ScreenMsg>()

export const homeMsg = (msg: Home.Msg): ScreenMsg => ScreenMsg.HomeMsg({ msg })
export const productsMsg = (msg: Products.Msg): ScreenMsg => ScreenMsg.ProductsMsg({ msg })
export const productCreateMsg = (msg: ProductCreate.Msg): ScreenMsg => ScreenMsg.ProductCreateMsg({ msg })
export const otpremnicaStavkeMsg = (msg: OtpremnicaStavke.Msg): ScreenMsg => ScreenMsg.OtpremnicaStavkeMsg({ msg })
