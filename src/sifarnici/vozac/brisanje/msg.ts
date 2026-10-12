import { Data as Tagged } from 'effect'
import type { ApiError } from '../../../common/error'

export type Msg = Tagged.TaggedEnum<{
  Submitted: {}
  Deleted: {}
  DeleteFailed: { readonly error: ApiError }
  Closed: {}
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const submitted = (): Msg => Msg.Submitted()

export const deleted = (): Msg => Msg.Deleted()

export const deleteFailed = (error: ApiError): Msg => Msg.DeleteFailed({ error })

export const closed = (): Msg => Msg.Closed()
