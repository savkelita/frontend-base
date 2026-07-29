import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { EditProductRecord } from '../api'
import type { ProductEditFormMsg } from './form'

export type Msg = Data.TaggedEnum<{
  Loaded: { readonly record: EditProductRecord }
  LoadFailed: { readonly error: Http.HttpError }
  Form: { readonly msg: ProductEditFormMsg }
  Submit: {}
  Saved: {}
  Failed: { readonly error: Http.HttpError }
  Cancel: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const loaded = (record: EditProductRecord): Msg => Msg.Loaded({ record })
export const loadFailed = (error: Http.HttpError): Msg => Msg.LoadFailed({ error })
export const formMsg = (msg: ProductEditFormMsg): Msg => Msg.Form({ msg })
export const submit = (): Msg => Msg.Submit()
export const saved = (): Msg => Msg.Saved()
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const cancel = (): Msg => Msg.Cancel()
