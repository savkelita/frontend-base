import * as Router from 'tea-effect/Router'

export const routes = Router.routes({
  home: Router.path('/'),
})

export type Route = Router.RouteType<typeof routes>
