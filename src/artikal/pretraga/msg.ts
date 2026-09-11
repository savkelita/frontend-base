import { Data } from 'effect'
import type * as List from '../../common/pretraga'
import type { FormMsg } from '../../common/forms'
import type { ArtikalOrder, ArtikalResult } from '../api'
import type * as Kreiranje from '../kreiranje'
import type { Polja } from './filter'

export type Red = ArtikalResult
export type Kolona = ArtikalOrder

// Три групе, једна по саставном делу екрана. Свака радња коју екран домаћини даје тачно
// два случаја: „покрени" и прослеђивање њених порука.
export type Msg = Data.TaggedEnum<{
  List: { readonly msg: List.Msg<Red, Kolona> }
  Filter: { readonly msg: FormMsg<Polja> }
  ShowFilter: { readonly otvoren: boolean }
  ApplyFilter: {}
  ClearFilter: {}
  StartKreiranje: {}
  Kreiranje: { readonly msg: Kreiranje.Msg }
}>

export const Msg = Data.taggedEnum<Msg>()

export const list = (msg: List.Msg<Red, Kolona>): Msg => Msg.List({ msg })
export const filter = (msg: FormMsg<Polja>): Msg => Msg.Filter({ msg })
export const showFilter = (otvoren: boolean): Msg => Msg.ShowFilter({ otvoren })
export const applyFilter = (): Msg => Msg.ApplyFilter()
export const clearFilter = (): Msg => Msg.ClearFilter()
export const startKreiranje = (): Msg => Msg.StartKreiranje()
export const kreiranje = (msg: Kreiranje.Msg): Msg => Msg.Kreiranje({ msg })
