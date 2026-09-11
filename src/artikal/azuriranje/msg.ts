import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ArtikalInfo } from '../api'
import type { ArtikalFormMsg } from './form'

// Исти ток као при креирању, само пред њим стоји учитавање записа: `Loaded` / `Failed`.
export type Msg = Data.TaggedEnum<{
  Loaded: { readonly original: ArtikalInfo }
  Failed: { readonly error: Http.HttpError }
  Form: { readonly msg: ArtikalFormMsg }
  Save: {}
  Saved: {}
  SaveFailed: { readonly error: Http.HttpError }
  Cancel: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const loaded = (original: ArtikalInfo): Msg => Msg.Loaded({ original })
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const form = (msg: ArtikalFormMsg): Msg => Msg.Form({ msg })
export const save = (): Msg => Msg.Save()
export const saved = (): Msg => Msg.Saved()
export const saveFailed = (error: Http.HttpError): Msg => Msg.SaveFailed({ error })
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
