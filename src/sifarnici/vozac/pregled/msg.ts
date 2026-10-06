import { Data as Tagged } from 'effect'
import type { ApiError } from '../../../common/error'
import type { VozacInfo } from '../../api'
import type * as Vozila from './vozila'

export type Msg = Tagged.TaggedEnum<{
  Received: { readonly vozac: VozacInfo }
  ReceiveFailed: { readonly error: ApiError }
  Retry: {}
  VozilaMsg: { readonly msg: Vozila.Msg }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const received = (vozac: VozacInfo): Msg => Msg.Received({ vozac })

export const receiveFailed = (error: ApiError): Msg => Msg.ReceiveFailed({ error })

export const retry = (): Msg => Msg.Retry()

export const vozilaMsg = (msg: Vozila.Msg): Msg => Msg.VozilaMsg({ msg })
