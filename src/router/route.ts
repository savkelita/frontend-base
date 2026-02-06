import * as Router from 'tea-effect/Router'
import type { Permission } from '../auth/types'

export const routes = Router.routes({
  home: Router.path('/'),
})

export type Route = Router.RouteType<typeof routes>

const routePermissions: Record<string, ReadonlyArray<Permission>> = {
  home: ['home.view'],
}

export const getRoutePermissions = (routeTag: string): ReadonlyArray<Permission> => routePermissions[routeTag] ?? []
