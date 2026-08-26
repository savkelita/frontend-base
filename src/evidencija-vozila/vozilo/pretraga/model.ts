import type { Data, Sort } from '../../../common/pretraga'
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../api'
import type * as Filter from './filter'

export const LIMIT = 100

export type Model = {
  readonly offset: number
  readonly sort: Sort<VoziloOrder> | null
  readonly criteria: VoziloCriteria
  readonly data: Data<Vozilo>
  readonly selected: ReadonlyArray<Vozilo>
  readonly filterModel: Filter.Model
}
