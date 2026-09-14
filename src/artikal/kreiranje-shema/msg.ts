import { Data } from 'effect'
import type { ObjekatIdentifikator } from '../../common/platform'
import type * as ComboDomain from '../../common/shema/domain/combo'
import type { ApiError } from '../../common/shema/error'
import type { JedinicaMere } from './api'
import type { FormValue } from './model'

// Свака промена форме је **једна** порука која носи целу вредност — за разлику од нашег
// приступа, где порука носи само то које се поље променило.
export type Msg = Data.TaggedEnum<{
  Changed: { readonly value: FormValue }
  Submitted: {}
  Saved: { readonly identifikator: ObjekatIdentifikator }
  SaveFailed: { readonly error: ApiError }
  Closed: {}
  JedinicaMereMsg: { readonly msg: ComboDomain.Msg<JedinicaMere> }
  GrupaArtiklaMsg: { readonly msg: ComboDomain.Msg<JedinicaMere> }
}>

export const Msg = Data.taggedEnum<Msg>()

export const changed = (value: FormValue): Msg => Msg.Changed({ value })
export const submitted = (): Msg => Msg.Submitted()
export const saved = (identifikator: ObjekatIdentifikator): Msg => Msg.Saved({ identifikator })
export const saveFailed = (error: ApiError): Msg => Msg.SaveFailed({ error })
export const closed = (): Msg => Msg.Closed()
export const jedinicaMereMsg = (msg: ComboDomain.Msg<JedinicaMere>): Msg => Msg.JedinicaMereMsg({ msg })
export const grupaArtiklaMsg = (msg: ComboDomain.Msg<JedinicaMere>): Msg => Msg.GrupaArtiklaMsg({ msg })

export type Outcome = Data.TaggedEnum<{
  Active: {}
  Success: { readonly identifikator: ObjekatIdentifikator }
  Cancel: {}
}>

export const Outcome = Data.taggedEnum<Outcome>()

export const active = (): Outcome => Outcome.Active()
export const success = (identifikator: ObjekatIdentifikator): Outcome => Outcome.Success({ identifikator })
export const cancelled = (): Outcome => Outcome.Cancel()
