import { Either, Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Sub from 'tea-effect/Sub'
import * as Task from 'tea-effect/Task'
import * as Navigation from 'tea-effect/Navigation'
import * as Router from 'tea-effect/Router'
import * as LocalStorage from 'tea-effect/LocalStorage'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { hasAllPermissions } from '../auth/types'
import * as Api from '../auth/api'
import { Session, SESSION_KEY, toAuthorizationConfig } from '../auth/session'
import * as Home from '../home'
import * as Products from '../products'
import * as Login from '../login'
import * as Nav from '../navigation'
import { routes, getRoutePermissions } from './route'
import type { Route } from './route'
import { Model } from './model'
import {
  Msg,
  urlRequested,
  urlChanged,
  screen,
  navigation,
  sessionLoaded,
  sessionLoadError,
  login,
  refreshTick,
  refreshCompleted,
} from './msg'
import { ScreenModel, homeScreen, productsScreen, notFoundScreen, unauthorizedScreen } from './screen-model'
import { ScreenMsg, homeMsg, productsMsg } from './screen-msg'
import { selectedNavValue, selectedCategoryValue } from './selected-nav'
import { Layout } from './components/layout'
import { NotFoundView } from './components/not-found-view'
import { UnauthorizedView } from './components/unauthorized-view'
import { AppHeader } from './components/app-header'
import { AppNavigation } from './components/app-navigation'
import { LoadingView } from './components/loading-view'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------

const locationToPath = (location: Navigation.Location): string => location.pathname + location.search + location.hash

const parseRoute = (location: Navigation.Location): Option.Option<Route> => Router.parse(routes, location)

const startScreen = (route: Route): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
  switch (route._tag) {
    case 'home': {
      const [model, cmd] = Home.init
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    }
    case 'products': {
      const [model, cmd] = Products.init
      return [productsScreen(model), Cmd.map(productsMsg)(cmd)]
    }
  }
}

const startScreenWithAuth = (
  route: Option.Option<Route>,
  path: string,
  config: ReturnType<typeof toAuthorizationConfig>,
): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  Option.match(route, {
    onNone: () => [notFoundScreen(path), Cmd.none],
    onSome: r => {
      const perms = getRoutePermissions(r._tag)
      if (!hasAllPermissions(config, perms)) return [unauthorizedScreen(path), Cmd.none]
      return startScreen(r)
    },
  })

const updateScreen = (msg: ScreenMsg, screenModel: ScreenModel): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  ScreenMsg.$match(msg, {
    HomeMsg: ({ msg: homeMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'HomeScreen') return [screenModel, Cmd.none]
      const [model, cmd] = Home.update(homeMessage, screenModel.model)
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    },
    ProductsMsg: ({ msg: productsMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'ProductsScreen') return [screenModel, Cmd.none]
      const [model, cmd] = Products.update(productsMessage, screenModel.model)
      return [productsScreen(model), Cmd.map(productsMsg)(cmd)]
    },
  })

const screenView = (screenModel: ScreenModel): TeaReact.Html<ScreenMsg> =>
  ScreenModel.$match(screenModel, {
    HomeScreen: ({ model }) => Html.map(homeMsg)(Home.view(model)),
    ProductsScreen: ({ model }) => Html.map(productsMsg)(Products.view(model)),
    NotFoundScreen:
      ({ path }) =>
      (_dispatch: Platform.Dispatch<ScreenMsg>) => <NotFoundView path={path} />,
    UnauthorizedScreen:
      ({ path }) =>
      (_dispatch: Platform.Dispatch<ScreenMsg>) => <UnauthorizedView path={path} />,
  })

const initAuthenticated = (session: typeof Session.Type, location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => {
  const config = toAuthorizationConfig(session)
  const route = parseRoute(location)
  const [screenModel, screenCmd] = startScreenWithAuth(route, location.pathname, config)
  const [navModel, navCmd] = Nav.init(config)
  return [
    Model.Authenticated({ session, location, screen: screenModel, navigation: navModel }),
    Cmd.batch([Cmd.map(screen)(screenCmd), Cmd.map(navigation)(navCmd)]),
  ]
}

const initAnonymous = (): [Model, Cmd.Cmd<Msg>] => {
  const [loginModel, loginCmd] = Login.init
  return [Model.Anonymous({ login: loginModel }), Cmd.map(login)(loginCmd)]
}

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

export const init = (location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => [
  Model.Initializing({ location }),
  LocalStorage.get(SESSION_KEY, Session, { onSuccess: sessionLoaded, onError: sessionLoadError }),
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    SessionLoaded: ({ session }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Initializing') return [model, Cmd.none]
      return Option.match(session, {
        onNone: () => initAnonymous(),
        onSome: s => initAuthenticated(s, model.location),
      })
    },

    SessionLoadError: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Initializing') return [model, Cmd.none]
      return initAnonymous()
    },

    Login: ({ loginMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Anonymous') return [model, Cmd.none]
      const [loginModel, loginCmd] = Login.update(loginMsg, model.login)
      if (Option.isSome(loginModel.result)) {
        const session = loginModel.result.value
        const location: Navigation.Location = {
          pathname: '/',
          search: '',
          hash: '',
          href: '/',
          origin: '',
        }
        const [authModel, authCmd] = initAuthenticated(session, location)
        return [authModel, Cmd.batch([authCmd, LocalStorage.setIgnoreErrors(SESSION_KEY, Session, session)])]
      }
      return [Model.Anonymous({ login: loginModel }), Cmd.map(login)(loginCmd)]
    },

    Logout: (): [Model, Cmd.Cmd<Msg>] => {
      const [anonModel, anonCmd] = initAnonymous()
      return [anonModel, Cmd.batch([anonCmd, LocalStorage.removeIgnoreErrors(SESSION_KEY)])]
    },

    UrlRequested: ({ request }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      switch (request._tag) {
        case 'Internal':
          return [model, Navigation.pushUrl(locationToPath(request.location))]
        case 'External':
          return [model, Navigation.load(request.href)]
      }
    },

    UrlChanged: ({ location }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const config = toAuthorizationConfig(model.session)
      const route = parseRoute(location)
      const [screenModel, screenCmd] = startScreenWithAuth(route, location.pathname, config)
      return [Model.Authenticated({ ...model, location, screen: screenModel }), Cmd.map(screen)(screenCmd)]
    },

    Screen: ({ screenMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const [screenModel, screenCmd] = updateScreen(screenMsg, model.screen)
      return [Model.Authenticated({ ...model, screen: screenModel }), Cmd.map(screen)(screenCmd)]
    },

    Navigation: ({ navMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const [navModel, navCmd] = Nav.update(navMsg, model.navigation)
      return [Model.Authenticated({ ...model, navigation: navModel }), Cmd.map(navigation)(navCmd)]
    },

    RefreshTick: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      return [model, Task.attempt(refreshCompleted)(Api.refresh(model.session.refreshToken))]
    },

    RefreshCompleted: ({ result }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      return Either.match(result, {
        onLeft: (): [Model, Cmd.Cmd<Msg>] => {
          const [anonModel, anonCmd] = initAnonymous()
          return [anonModel, Cmd.batch([anonCmd, LocalStorage.removeIgnoreErrors(SESSION_KEY)])]
        },
        onRight: (refreshResult): [Model, Cmd.Cmd<Msg>] => {
          const updatedSession: typeof Session.Type = {
            ...model.session,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken,
          }
          return [
            Model.Authenticated({ ...model, session: updatedSession }),
            LocalStorage.setIgnoreErrors(SESSION_KEY, Session, updatedSession),
          ]
        },
      })
    },
  })

// -------------------------------------------------------------------------------------
// Subscriptions
// -------------------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 4 * 60 * 1000

export const subscriptions = (model: Model): Sub.Sub<Msg> => {
  if (model._tag !== 'Authenticated') return Sub.none
  return Sub.interval(REFRESH_INTERVAL_MS, refreshTick())
}

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Model.$match(model, {
      Initializing: () => <LoadingView />,
      Anonymous: ({ login: loginModel }) => Html.map(login)(Login.view(loginModel))(dispatch),
      Authenticated: m => (
        <Layout
          header={<AppHeader isOpen={m.navigation.isOpen} username={m.session.username} dispatch={dispatch} />}
          nav={
            <AppNavigation
              model={m.navigation}
              selectedValue={selectedNavValue(m.screen)}
              selectedCategoryValue={selectedCategoryValue(m.screen)}
              dispatch={dispatch}
            />
          }
        >
          {Html.map(screen)(screenView(m.screen))(dispatch)}
        </Layout>
      ),
    })

// -------------------------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------------------------

export const onUrlRequest = urlRequested

export const onUrlChange = urlChanged
