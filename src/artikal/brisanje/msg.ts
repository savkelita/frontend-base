import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'

export type Msg = Data.TaggedEnum<{
  Delete: {}
  Deleted: {}
  Failed: { readonly error: Http.HttpError }
  Cancel: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const deleteRecord = (): Msg => Msg.Delete()
export const deleted = (): Msg => Msg.Deleted()
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const cancel = (): Msg => Msg.Cancel()

export type Outcome = Data.TaggedEnum<{
  Active: {}
  Success: {}
  Cancel: {}
}>

export const Outcome = Data.taggedEnum<Outcome>()

/** Исходи као у затеченом стеку (`active` / `success` / `cancel`); враћају пун тип уније. */
export const active = (): Outcome => Outcome.Active()
export const success = (): Outcome => Outcome.Success()
export const cancelled = (): Outcome => Outcome.Cancel()
