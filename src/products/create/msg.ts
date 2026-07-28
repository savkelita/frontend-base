import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { CreatedProduct } from '../api'
import type { ProductFormMsg } from './form'

export type Msg = Data.TaggedEnum<{
  Form: { readonly msg: ProductFormMsg }
  Submit: {}
  Saved: { readonly product: CreatedProduct }
  Failed: { readonly error: Http.HttpError }
}>

export const Msg = Data.taggedEnum<Msg>()

export const formMsg = (msg: ProductFormMsg): Msg => Msg.Form({ msg })
export const submit = (): Msg => Msg.Submit()
export const saved = (product: CreatedProduct): Msg => Msg.Saved({ product })
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
