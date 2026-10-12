import { Data as Tagged } from 'effect'
import type * as Combo from '../../../common/domain/combo'
import type { ApiError } from '../../../common/error'
import type { ObjekatIdentifikator } from '../../../common/http/identifikator'
import type * as Kategorija from '../../domain/kategorija-vozaca'
import type { FormValue } from './model'

export type Msg = Tagged.TaggedEnum<{
  Changed: { readonly value: FormValue }
  Submitted: {}
  Saved: { readonly identifikator: ObjekatIdentifikator }
  SaveFailed: { readonly error: ApiError }
  Closed: {}
  KategorijeMsg: { readonly msg: Combo.Msg<Kategorija.Value> }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const changed = (value: FormValue): Msg => Msg.Changed({ value })

export const submitted = (): Msg => Msg.Submitted()

export const saved = (identifikator: ObjekatIdentifikator): Msg => Msg.Saved({ identifikator })

export const saveFailed = (error: ApiError): Msg => Msg.SaveFailed({ error })

export const closed = (): Msg => Msg.Closed()

export const kategorijeMsg = (msg: Combo.Msg<Kategorija.Value>): Msg => Msg.KategorijeMsg({ msg })
