import * as Router from 'tea-effect/Router'
import type { Funkcionalnost } from '../auth/types'
import * as VozilaPretraga from '../evidencija-vozila/vozilo/pretraga'
import * as VozacPregled from '../sifarnici/vozac/pregled'
import * as VozaciPretraga from '../sifarnici/vozac/pretraga'

export const routes = Router.routes({
  home: Router.path('/'),
  vozac: VozacPregled.route,
  vozaci: VozaciPretraga.route,
  vozila: VozilaPretraga.route,
})

export type Route = Router.RouteType<typeof routes>

const routeFunkcionalnosti: Record<Route['_tag'], ReadonlyArray<Funkcionalnost>> = {
  home: [],
  vozac: VozacPregled.FUNKCIONALNOSTI,
  vozaci: VozaciPretraga.FUNKCIONALNOSTI,
  vozila: VozilaPretraga.FUNKCIONALNOSTI,
}

export const getRouteFunkcionalnosti = (routeTag: Route['_tag']): ReadonlyArray<Funkcionalnost> =>
  routeFunkcionalnosti[routeTag]
