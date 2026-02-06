import { Hamburger, Text } from '@fluentui/react-components'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Sub from 'tea-effect/Sub'
import * as Navigation from 'tea-effect/Navigation'
import * as Router from 'tea-effect/Router'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Home from '../home'
import * as Nav from '../navigation'
import { routes } from './route'
import type { Route } from './route'
import type { Model } from './model'
import { Msg, urlRequested, urlChanged, screen, navigation } from './msg'
import { ScreenModel, homeScreen, notFoundScreen } from './screen-model'
import { ScreenMsg, homeMsg } from './screen-msg'
import { selectedNavValue, selectedCategoryValue } from './selected-nav'
import { Layout } from './components/layout'
import { NotFoundView } from './components/not-found-view'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------

const locationToPath = (location: Navigation.Location): string => location.pathname + location.search + location.hash

const parseRoute = (location: Navigation.Location): Option.Option<Route> => Router.parse(routes, location)

const startScreen = (route: Option.Option<Route>, path: string): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  Option.match(route, {
    onNone: () => [notFoundScreen(path), Cmd.none],
    onSome: r => {
      switch (r._tag) {
        case 'home': {
          const [model, cmd] = Home.init
          return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
        }
      }
    },
  })

const updateScreen = (msg: ScreenMsg, screenModel: ScreenModel): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  ScreenMsg.$match(msg, {
    HomeMsg: ({ msg: homeMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'HomeScreen') return [screenModel, Cmd.none]
      const [model, cmd] = Home.update(homeMessage, screenModel.model)
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    },
  })

const screenView = (screenModel: ScreenModel): TeaReact.Html<ScreenMsg> =>
  ScreenModel.$match(screenModel, {
    HomeScreen: ({ model }) => Html.map(homeMsg)(Home.view(model)),
    NotFoundScreen:
      ({ path }) =>
      (_dispatch: Platform.Dispatch<ScreenMsg>) => <NotFoundView path={path} />,
  })

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

export const init = (location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => {
  const route = parseRoute(location)
  const [screenModel, screenCmd] = startScreen(route, location.pathname)
  const [navModel, navCmd] = Nav.init
  return [
    { location, screen: screenModel, navigation: navModel },
    Cmd.batch([Cmd.map(screen)(screenCmd), Cmd.map(navigation)(navCmd)]),
  ]
}

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    UrlRequested: ({ request }): [Model, Cmd.Cmd<Msg>] => {
      switch (request._tag) {
        case 'Internal':
          return [model, Navigation.pushUrl(locationToPath(request.location))]
        case 'External':
          return [model, Navigation.load(request.href)]
      }
    },
    UrlChanged: ({ location }): [Model, Cmd.Cmd<Msg>] => {
      const route = parseRoute(location)
      const [screenModel, screenCmd] = startScreen(route, location.pathname)
      return [{ ...model, location, screen: screenModel }, Cmd.map(screen)(screenCmd)]
    },
    Screen: ({ screenMsg }): [Model, Cmd.Cmd<Msg>] => {
      const [screenModel, screenCmd] = updateScreen(screenMsg, model.screen)
      return [{ ...model, screen: screenModel }, Cmd.map(screen)(screenCmd)]
    },
    Navigation: ({ navMsg }): [Model, Cmd.Cmd<Msg>] => {
      const [navModel, navCmd] = Nav.update(navMsg, model.navigation)
      return [{ ...model, navigation: navModel }, Cmd.map(navigation)(navCmd)]
    },
  })

// -------------------------------------------------------------------------------------
// Subscriptions
// -------------------------------------------------------------------------------------

export const subscriptions = (_model: Model): Sub.Sub<Msg> => Sub.none

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => (
    <Layout
      header={
        <>
          <Hamburger onClick={() => dispatch(navigation(Nav.toggleDrawer(!model.navigation.isOpen)))} />
          <Text weight="semibold">frontend-base</Text>
        </>
      }
      nav={Html.map(navigation)(
        Nav.view(model.navigation, selectedNavValue(model.screen), selectedCategoryValue(model.screen)),
      )(dispatch)}
    >
      {Html.map(screen)(screenView(model.screen))(dispatch)}
    </Layout>
  )

// -------------------------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------------------------

export const onUrlRequest = urlRequested

export const onUrlChange = urlChanged
