import type { Option } from 'effect'
import type { Data, Sort } from '../../../common/pretraga'
import type { Vozac, VozacCriteria, VozacOrder } from '../../api'
import type * as Azuriranje from '../azuriranje'
import type * as Brisanje from '../brisanje'
import type * as Kreiranje from '../kreiranje'
import type * as Filter from './filter'

export const LIMIT = 5

export type Model = {
  readonly offset: number
  readonly sort: Sort<VozacOrder> | null
  readonly criteria: VozacCriteria
  readonly data: Data<Vozac>
  readonly selected: ReadonlyArray<Vozac>
  readonly filterModel: Filter.Model
  readonly kreiranje: Option.Option<Kreiranje.Model>
  readonly azuriranje: Option.Option<Azuriranje.Model>
  readonly brisanje: Option.Option<Brisanje.Model>
}
