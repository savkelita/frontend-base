import { Data } from 'effect'
import type { ObjekatIdentifikator } from '../../common/platform'
import type { ApiError } from '../../common/shema/error'
import type { FormMsg } from './form'

// Једна порука за целу форму — и за куцање по текстуалном пољу, и за отварање комбоа, и за
// избор реда из њега. Екран не зна колико форма има комбоа ни да их уопште има.
export type Msg = Data.TaggedEnum<{
  Form: { readonly msg: FormMsg }
  Submitted: {}
  Saved: { readonly identifikator: ObjekatIdentifikator }
  SaveFailed: { readonly error: ApiError }
  Closed: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const formMsg = (msg: FormMsg): Msg => Msg.Form({ msg })
export const submitted = (): Msg => Msg.Submitted()
export const saved = (identifikator: ObjekatIdentifikator): Msg => Msg.Saved({ identifikator })
export const saveFailed = (error: ApiError): Msg => Msg.SaveFailed({ error })
export const closed = (): Msg => Msg.Closed()

export type Outcome = Data.TaggedEnum<{
  Active: {}
  Success: { readonly identifikator: ObjekatIdentifikator }
  Cancel: {}
}>

export const Outcome = Data.taggedEnum<Outcome>()

export const active = (): Outcome => Outcome.Active()
export const success = (identifikator: ObjekatIdentifikator): Outcome => Outcome.Success({ identifikator })
export const cancelled = (): Outcome => Outcome.Cancel()
