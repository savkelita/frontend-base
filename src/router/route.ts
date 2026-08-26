import * as Router from 'tea-effect/Router'
import type { Funkcionalnost } from '../auth/types'
import * as VozilaPretraga from '../evidencija-vozila/vozilo/pretraga'
import * as VozaciPretraga from '../sifarnici/vozac/pretraga'

export const routes = Router.routes({
  home: Router.path('/'),
  vozaci: VozaciPretraga.route,
  vozila: VozilaPretraga.route,
})

export type Route = Router.RouteType<typeof routes>

const routeFunkcionalnosti: Record<string, ReadonlyArray<Funkcionalnost>> = {
  vozaci: VozaciPretraga.FUNKCIONALNOSTI,
  vozila: VozilaPretraga.FUNKCIONALNOSTI,
}

export const getRouteFunkcionalnosti = (routeTag: string): ReadonlyArray<Funkcionalnost> =>
  routeFunkcionalnosti[routeTag] ?? []
