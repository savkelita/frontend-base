import { Data as Tagged } from 'effect'
import type { ApiError } from '../../../common/error'
import type { Page, PretragaRequest, Sort } from '../../../common/pretraga'
import type { Vozac, VozacCriteria, VozacOrder } from '../../api'
import type * as Kreiranje from '../kreiranje'
import type * as Filter from './filter'

type Request = PretragaRequest<VozacCriteria, VozacOrder>

export type Msg = Tagged.TaggedEnum<{
  Loaded: { readonly request: Request; readonly page: Page<Vozac> }
  Failed: { readonly request: Request; readonly error: ApiError }
  Sorted: { readonly sort: Sort<VozacOrder> }
  PageChanged: { readonly offset: number }
  SelectionChanged: { readonly rows: ReadonlyArray<Vozac> }
  Retry: {}
  FilterMsg: { readonly msg: Filter.Msg }
  StartKreiranje: {}
  KreiranjeMsg: { readonly msg: Kreiranje.Msg }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const loaded = (request: Request, page: Page<Vozac>): Msg => Msg.Loaded({ request, page })

export const failed = (request: Request, error: ApiError): Msg => Msg.Failed({ request, error })

export const sorted = (sort: Sort<VozacOrder>): Msg => Msg.Sorted({ sort })

export const pageChanged = (offset: number): Msg => Msg.PageChanged({ offset })

export const selectionChanged = (rows: ReadonlyArray<Vozac>): Msg => Msg.SelectionChanged({ rows })

export const retry = (): Msg => Msg.Retry()

export const filterMsg = (msg: Filter.Msg): Msg => Msg.FilterMsg({ msg })

export const startKreiranje = (): Msg => Msg.StartKreiranje()

export const kreiranjeMsg = (msg: Kreiranje.Msg): Msg => Msg.KreiranjeMsg({ msg })
