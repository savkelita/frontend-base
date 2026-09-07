import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ProductsResponse } from './api'
import type * as Delete from './delete'
import type * as Edit from './edit'

export type Msg = Data.TaggedEnum<{
  LoadProducts: {}
  ProductsLoaded: { readonly response: ProductsResponse }
  ProductsFailed: { readonly error: Http.HttpError }
  RequestEdit: { readonly id: number }
  EditMsg: { readonly msg: Edit.Msg }
  RequestDelete: { readonly id: number; readonly title: string }
  DeleteMsg: { readonly msg: Delete.Msg }
}>

export const Msg = Data.taggedEnum<Msg>()

export const loadProducts = (): Msg => Msg.LoadProducts()
export const productsLoaded = (response: ProductsResponse): Msg => Msg.ProductsLoaded({ response })
export const productsFailed = (error: Http.HttpError): Msg => Msg.ProductsFailed({ error })
export const requestEdit = (id: number): Msg => Msg.RequestEdit({ id })
export const editMsg = (msg: Edit.Msg): Msg => Msg.EditMsg({ msg })
export const requestDelete = (id: number, title: string): Msg => Msg.RequestDelete({ id, title })
export const deleteMsg = (msg: Delete.Msg): Msg => Msg.DeleteMsg({ msg })
