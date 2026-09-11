import type { Option } from 'effect'
import type { FormModel } from '../../common/forms'
import type * as List from '../../common/pretraga'
import type * as Kreiranje from '../kreiranje'
import type { Polja } from './filter'
import type { Kolona, Red } from './msg'

// -------------------------------------------------------------------------------------
// Претрага артикала — стање
// -------------------------------------------------------------------------------------
//
// Три дела екрана, три поља: листа, филтер и отворена радња. Ниједно од њих не зна за
// друга два — листа не зна да филтер постоји, филтер не зна шта се претражује.

export type Model = {
  readonly list: List.Model<Red, Kolona>
  readonly filter: FormModel<Polja>
  readonly filterOtvoren: boolean
  readonly kreiranje: Option.Option<Kreiranje.Model>
}
