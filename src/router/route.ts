import * as Router from 'tea-effect/Router'
import type { Permission } from '../auth/types'
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

const PERMISSIONS_BY_ROUTE: Record<Route['_tag'], ReadonlyArray<Permission>> = {
  home: [],
  vozac: VozacPregled.PERMISSIONS,
  vozaci: VozaciPretraga.PERMISSIONS,
  vozila: VozilaPretraga.PERMISSIONS,
}

export const routePermissions = (routeTag: Route['_tag']): ReadonlyArray<Permission> => PERMISSIONS_BY_ROUTE[routeTag]
