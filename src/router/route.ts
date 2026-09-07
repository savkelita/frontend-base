import { Schema } from 'effect'
import * as Router from 'tea-effect/Router'
import type { Permission } from '../auth/types'

export const routes = Router.routes({
  home: Router.path('/'),
  productsNew: Router.path('/products/new'),
  products: Router.path('/products'),
  otpremnicaStavke: Router.path('/otpremnice/:otpremnicaID/stavke', { otpremnicaID: Schema.NumberFromString }),
})

export type Route = Router.RouteType<typeof routes>

const routePermissions: Record<string, ReadonlyArray<Permission>> = {
  home: ['home.view'],
  productsNew: ['products.view'],
  products: ['products.view'],
  otpremnicaStavke: ['products.view'],
}

export const getRoutePermissions = (routeTag: string): ReadonlyArray<Permission> => routePermissions[routeTag] ?? []
