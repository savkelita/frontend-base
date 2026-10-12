import { Data as Tagged } from 'effect'
import type * as Combo from '../../../../common/domain/combo'
import type * as KorisnikVozila from '../../../../sifarnici/domain/korisnik-vozila'
import type * as MarkaVozila from '../../../../sifarnici/domain/marka-vozila'
import type * as ModelVozila from '../../../../sifarnici/domain/model-vozila'
import type * as Vozac from '../../../../sifarnici/domain/vozac'
import type * as VrstaGoriva from '../../../../sifarnici/domain/vrsta-goriva'
import type * as VrstaVozila from '../../../../sifarnici/domain/vrsta-vozila'
import type { FormValue } from './model'

export type Msg = Tagged.TaggedEnum<{
  Changed: { readonly value: FormValue }
  Submitted: {}
  Cleared: {}
  Toggled: {}
  MarkaMsg: { readonly msg: Combo.Msg<MarkaVozila.Value> }
  ModelMsg: { readonly msg: Combo.Msg<ModelVozila.Value> }
  VrstaGorivaMsg: { readonly msg: Combo.Msg<VrstaGoriva.Value> }
  VrstaVozilaMsg: { readonly msg: Combo.Msg<VrstaVozila.Value> }
  KorisnikVozilaMsg: { readonly msg: Combo.Msg<KorisnikVozila.Value> }
  VozacMsg: { readonly msg: Combo.Msg<Vozac.Value> }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const changed = (value: FormValue): Msg => Msg.Changed({ value })

export const submitted = (): Msg => Msg.Submitted()

export const cleared = (): Msg => Msg.Cleared()

export const toggled = (): Msg => Msg.Toggled()

export const markaMsg = (msg: Combo.Msg<MarkaVozila.Value>): Msg => Msg.MarkaMsg({ msg })

export const modelMsg = (msg: Combo.Msg<ModelVozila.Value>): Msg => Msg.ModelMsg({ msg })

export const vrstaGorivaMsg = (msg: Combo.Msg<VrstaGoriva.Value>): Msg => Msg.VrstaGorivaMsg({ msg })

export const vrstaVozilaMsg = (msg: Combo.Msg<VrstaVozila.Value>): Msg => Msg.VrstaVozilaMsg({ msg })

export const korisnikVozilaMsg = (msg: Combo.Msg<KorisnikVozila.Value>): Msg => Msg.KorisnikVozilaMsg({ msg })

export const vozacMsg = (msg: Combo.Msg<Vozac.Value>): Msg => Msg.VozacMsg({ msg })
