import type { AuthorizationConfig } from '../auth/types'
import { funkcionalnost } from '../auth/types'
import type * as Azuriranje from './azuriranje'
import type * as Brisanje from './brisanje'
import type * as Kreiranje from './kreiranje'

export * as Api from './api'
export * as Pretraga from './pretraga'
export * as Pregled from './pregled'

// -------------------------------------------------------------------------------------
// Права модула
// -------------------------------------------------------------------------------------
//
// Свака радња тражи свој улазни тип (`Kreiranje.Authorization` и слични); овде се на једном
// месту преводе из листе права коју шаље сервер. Радња тако остаје као у затеченом стеку —
// гледа `funkcionalnosti.KreiranjeArtikla` и ништа не зна о томе како је право стигло.

export type Authorization = Kreiranje.Authorization & Azuriranje.Authorization & Brisanje.Authorization

export const authorization = (config: AuthorizationConfig): Authorization => ({
  funkcionalnosti: {
    KreiranjeArtikla: funkcionalnost(config, 'artikal.kreiranje'),
    AzuriranjeArtikla: funkcionalnost(config, 'artikal.azuriranje'),
    BrisanjeArtikla: funkcionalnost(config, 'artikal.brisanje'),
  },
})
