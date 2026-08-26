import { Data as Tagged } from 'effect'
import type { ApiError } from '../../../common/error'
import type { Page, PretragaRequest, Sort } from '../../../common/pretraga'
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../api'
import type * as Filter from './filter'

type Request = PretragaRequest<VoziloCriteria, VoziloOrder>

export type Msg = Tagged.TaggedEnum<{
  Loaded: { readonly request: Request; readonly page: Page<Vozilo> }
  Failed: { readonly request: Request; readonly error: ApiError }
  Sorted: { readonly sort: Sort<VoziloOrder> }
  PageChanged: { readonly offset: number }
  SelectionChanged: { readonly rows: ReadonlyArray<Vozilo> }
  Retry: {}
  FilterMsg: { readonly msg: Filter.Msg }
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const loaded = (request: Request, page: Page<Vozilo>): Msg => Msg.Loaded({ request, page })

export const failed = (request: Request, error: ApiError): Msg => Msg.Failed({ request, error })

export const sorted = (sort: Sort<VoziloOrder>): Msg => Msg.Sorted({ sort })

export const pageChanged = (offset: number): Msg => Msg.PageChanged({ offset })

export const selectionChanged = (rows: ReadonlyArray<Vozilo>): Msg => Msg.SelectionChanged({ rows })

export const retry = (): Msg => Msg.Retry()

export const filterMsg = (msg: Filter.Msg): Msg => Msg.FilterMsg({ msg })
