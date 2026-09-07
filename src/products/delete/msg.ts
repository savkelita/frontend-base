import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'

export type Msg = Data.TaggedEnum<{
  Confirm: {}
  Cancel: {}
  Deleted: {}
  Failed: { readonly error: Http.HttpError }
}>

export const Msg = Data.taggedEnum<Msg>()

export const confirm = (): Msg => Msg.Confirm()
export const cancel = (): Msg => Msg.Cancel()
export const deleted = (): Msg => Msg.Deleted()
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
