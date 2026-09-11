import { Option, Schema } from 'effect'
import * as Router from 'tea-effect/Router'
import type * as Navigation from 'tea-effect/Navigation'
import type { Permission } from '../auth/types'
import { basePath } from '../config'

// -------------------------------------------------------------------------------------
// Руте
// -------------------------------------------------------------------------------------
//
// Префикс инстанце (`/Magacin1`) решен је **овде и само овде**: `putanja` га додаје,
// `parse` га скида. Екрани и навигација зову ове две функције и не знају да префикс
// постоји. У затеченим .NET пројектима `getBasePath()` стоји у 77 / 41 / 81 фајлу — сваки
// од њих је прилика да се негде заборави.

export const routes = Router.routes({
  home: Router.path('/'),
  otpremnicaStavke: Router.path('/otpremnice/:otpremnicaID/stavke', { otpremnicaID: Schema.NumberFromString }),
  artikli: Router.path('/artikli'),
  artikal: Router.path('/artikli/:artikalID', { artikalID: Schema.NumberFromString }),
})

export type Route = Router.RouteType<typeof routes>

/**
 * Путања из које се скида префикс. `undefined` значи да путања не припада овој инстанци —
 * рута се тада не препознаје, уместо да се тумачи као да префикса није ни било.
 */
export const skiniPrefiks = (prefiks: string, pathname: string): string | undefined => {
  if (prefiks === '') return pathname
  if (pathname === prefiks) return '/'
  if (!pathname.startsWith(prefiks + '/')) return undefined
  return pathname.slice(prefiks.length)
}

/** Путања за адресну линију — са префиксом инстанце. */
export const putanja = <T extends (typeof routes)[keyof typeof routes]>(
  route: T,
  params: Parameters<typeof Router.format<T>>[1],
): string => basePath() + Router.format(route, params)

export const parse = (location: Navigation.Location): Option.Option<Route> => {
  const pathname = skiniPrefiks(basePath(), location.pathname)
  return pathname === undefined ? Option.none() : Router.parse(routes, { ...location, pathname })
}

const routePermissions: Record<string, ReadonlyArray<Permission>> = {
  home: ['home.view'],
  otpremnicaStavke: ['otpremnice.view'],
  artikli: ['artikal.view'],
  artikal: ['artikal.view'],
}

export const getRoutePermissions = (routeTag: string): ReadonlyArray<Permission> => routePermissions[routeTag] ?? []
