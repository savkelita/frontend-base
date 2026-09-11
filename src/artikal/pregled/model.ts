import type { Option } from 'effect'
import type * as State from '../../common/state'
import type { ArtikalInfo } from '../api'
import type * as Azuriranje from '../azuriranje'
import type * as Brisanje from '../brisanje'
import type * as Pakovanja from '../pregled-svih'

// -------------------------------------------------------------------------------------
// Преглед артикла — стање
// -------------------------------------------------------------------------------------
//
// Три гране (`Loading | Loaded | Failed`) стоје у `common/state`; овде је само оно што је
// у њима. Отворена радња је `Option` унутар учитаног стања: пре него што се запис учита,
// нема шта да се мења ни брише, па те гране не могу ни да постоје.

export type LoadedModel = {
  readonly original: ArtikalInfo
  readonly azuriranje: Option.Option<Azuriranje.Model>
  readonly brisanje: Option.Option<Brisanje.Model>
  readonly pakovanja: Pakovanja.Model
}

export type Model = State.Load<LoadedModel>
