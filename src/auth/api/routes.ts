import { makeApi, profiles, sNoContent } from '../../common/platform'
import { sPrijava, sSesijaOdgovor } from './types'

// -------------------------------------------------------------------------------------
// Руте аутентикације
// -------------------------------------------------------------------------------------
//
// Профил је овде без значаја — аутентикација не иде кроз претрагу, а исти колачић важи код
// оба backend-а. `makeApi` се користи да и ови захтеви добију XSRF заглавље.

const api = makeApi(profiles.java, '/api/autentifikacija')

export const prijava = api.komanda('prijava', sPrijava, sSesijaOdgovor)

/** Сесија коју колачић већ носи; 401 значи да пријаве нема. */
export const tekucaSesija = api.pozovi('tekucaSesija', sSesijaOdgovor)

export const produziSesiju = api.pozovi('produziSesiju', sSesijaOdgovor)

export const odjava = api.pozovi('odjava', sNoContent)
