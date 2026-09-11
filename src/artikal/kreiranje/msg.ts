import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ObjekatIdentifikator } from '../../common/platform'
import type { ArtikalFormMsg } from './form'

// -------------------------------------------------------------------------------------
// Поруке радње
// -------------------------------------------------------------------------------------
//
// Ток снимања има исти распоред у сваком модулу, па су и имена иста и на енглеском:
// `Form` / `Save` / `Saved` / `Failed` / `Cancel`. Домаћин не мора да чита ниједну
// радњу да би знао шта од ње може да очекује.

export type Msg = Data.TaggedEnum<{
  Form: { readonly msg: ArtikalFormMsg }
  Save: {}
  Saved: { readonly identifikator: ObjekatIdentifikator }
  Failed: { readonly error: Http.HttpError }
  Cancel: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const form = (msg: ArtikalFormMsg): Msg => Msg.Form({ msg })
export const save = (): Msg => Msg.Save()
export const saved = (identifikator: ObjekatIdentifikator): Msg => Msg.Saved({ identifikator })
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const cancel = (): Msg => Msg.Cancel()

// -------------------------------------------------------------------------------------
// Outcome — оно на шта домаћин мора да реагује
// -------------------------------------------------------------------------------------
//
// Одговара `ResultState`-у из затеченог стека (`active` / `success` / `cancel`), само без
// гране за грешку: грешка снимања остаје у дијалогу, где корисник може да поправи унос —
// она није исход него стање.

export type Outcome = Data.TaggedEnum<{
  Active: {}
  Success: { readonly identifikator: ObjekatIdentifikator }
  Cancel: {}
}>

export const Outcome = Data.taggedEnum<Outcome>()

/** Исходи као у затеченом стеку (`active` / `success` / `cancel`); враћају пун тип уније. */
export const active = (): Outcome => Outcome.Active()
export const success = (identifikator: ObjekatIdentifikator): Outcome => Outcome.Success({ identifikator })
export const cancelled = (): Outcome => Outcome.Cancel()
