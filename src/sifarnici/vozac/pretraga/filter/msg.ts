import { Data as Tagged } from 'effect'
import type * as Combo from '../../../../common/domain/combo'
import type * as Kategorija from '../../../domain/kategorija-vozaca'
import type { FormValue } from './model'

export type Msg = Tagged.TaggedEnum<{
  Changed: { readonly value: FormValue }
  Submitted: {}
  Cleared: {}
  Toggled: {}
  KategorijaMsg: { readonly msg: Combo.Msg<Kategorija.Value> }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const changed = (value: FormValue): Msg => Msg.Changed({ value })

export const submitted = (): Msg => Msg.Submitted()

export const cleared = (): Msg => Msg.Cleared()

export const toggled = (): Msg => Msg.Toggled()

export const kategorijaMsg = (msg: Combo.Msg<Kategorija.Value>): Msg => Msg.KategorijaMsg({ msg })
