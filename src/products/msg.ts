import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ProductsResponse } from './api'

export type Msg = Data.TaggedEnum<{
  LoadProducts: {}
  ProductsLoaded: { readonly response: ProductsResponse }
  ProductsFailed: { readonly error: Http.HttpError }
}>

export const Msg = Data.taggedEnum<Msg>()

export const loadProducts = (): Msg => Msg.LoadProducts()
export const productsLoaded = (response: ProductsResponse): Msg => Msg.ProductsLoaded({ response })
export const productsFailed = (error: Http.HttpError): Msg => Msg.ProductsFailed({ error })
