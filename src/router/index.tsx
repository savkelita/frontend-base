import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import * as LocalStorage from 'tea-effect/LocalStorage'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Router from 'tea-effect/Router'
import * as Sub from 'tea-effect/Sub'
import * as Api from '../auth/api'
import { Session, SESSION_KEY, displayName, toAuthorizationConfig } from '../auth/session'
import { hasAllFunkcionalnosti, type AuthorizationConfig } from '../auth/types'
import * as VozilaPretraga from '../evidencija-vozila/vozilo/pretraga'
import * as Home from '../home'
import * as Login from '../login'
import * as Nav from '../navigation'
import * as VozaciPretraga from '../sifarnici/vozac/pretraga'
import { AppHeader } from './components/app-header'
import { AppNavigation } from './components/app-navigation'
import { Layout } from './components/layout'
import { LoadingView } from './components/loading-view'
import { NotFoundView } from './components/not-found-view'
import { UnauthorizedView } from './components/unauthorized-view'
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
  logoutCompleted,
} from './msg'
import { routes, getRouteFunkcionalnosti } from './route'
import type { Route } from './route'
import { ScreenModel, homeScreen, notFoundScreen, unauthorizedScreen, vozaciScreen, vozilaScreen } from './screen-model'
import { ScreenMsg, homeMsg, vozaciMsg, vozilaMsg } from './screen-msg'
import { selectedNavValue, selectedCategoryValue } from './selected-nav'

export type { Model }
export type { Msg }

const locationToPath = (location: Navigation.Location): string => location.pathname + location.search + location.hash

const parseRoute = (location: Navigation.Location): Option.Option<Route> => Router.parse(routes, location)

const startScreen = (route: Route, state: unknown, previous?: ScreenModel): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
  switch (route._tag) {
    case 'home': {
      const [model, cmd] = Home.init
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    }
    case 'vozaci': {
      const [model, cmd] = VozaciPretraga.init(
        route.query,
        state,
        previous?._tag === 'VozaciScreen' ? previous.model : undefined,
      )
      return [vozaciScreen(model), Cmd.map(vozaciMsg)(cmd)]
    }
    case 'vozila': {
      const [model, cmd] = VozilaPretraga.init(
        route.query,
        state,
        previous?._tag === 'VozilaScreen' ? previous.model : undefined,
      )
      return [vozilaScreen(model), Cmd.map(vozilaMsg)(cmd)]
    }
  }
}

const startScreenWithAuth = (
  route: Option.Option<Route>,
  location: Navigation.Location,
  config: AuthorizationConfig,
  previous?: ScreenModel,
): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  Option.match(route, {
    onNone: () => [notFoundScreen(location.pathname), Cmd.none],
    onSome: r => {
      const trazene = getRouteFunkcionalnosti(r._tag)
      if (!hasAllFunkcionalnosti(config, trazene)) return [unauthorizedScreen(location.pathname), Cmd.none]
      return startScreen(r, location.state, previous)
    },
  })

const updateScreen = (msg: ScreenMsg, screenModel: ScreenModel): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  ScreenMsg.$match(msg, {
    HomeMsg: ({ msg: homeMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'HomeScreen') return [screenModel, Cmd.none]
      const [model, cmd] = Home.update(homeMessage, screenModel.model)
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    },
    VozaciMsg: ({ msg: vozaciMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'VozaciScreen') return [screenModel, Cmd.none]
      const [model, cmd] = VozaciPretraga.update(vozaciMessage, screenModel.model)
      return [vozaciScreen(model), Cmd.map(vozaciMsg)(cmd)]
    },
    VozilaMsg: ({ msg: vozilaMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'VozilaScreen') return [screenModel, Cmd.none]
      const [model, cmd] = VozilaPretraga.update(vozilaMessage, screenModel.model)
      return [vozilaScreen(model), Cmd.map(vozilaMsg)(cmd)]
    },
  })

const screenView =
  (config: AuthorizationConfig, screenModel: ScreenModel): TeaReact.Html<ScreenMsg> =>
  (dispatch: Platform.Dispatch<ScreenMsg>) =>
    ScreenModel.$match(screenModel, {
      HomeScreen: ({ model }) => Html.map(homeMsg)(Home.view(model))(dispatch),
      VozaciScreen: ({ model }) => Html.map(vozaciMsg)(VozaciPretraga.view(config, model))(dispatch),
      VozilaScreen: ({ model }) => Html.map(vozilaMsg)(VozilaPretraga.view(model))(dispatch),
      NotFoundScreen: ({ path }) => <NotFoundView path={path} />,
      UnauthorizedScreen: ({ path }) => <UnauthorizedView path={path} />,
    })

const initAuthenticated = (session: typeof Session.Type, location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => {
  const config = toAuthorizationConfig(session)
  const route = parseRoute(location)
  const [screenModel, screenCmd] = startScreenWithAuth(route, location, config)
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

export const init = (location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => [
  Model.Initializing({ location }),
  LocalStorage.get(SESSION_KEY, Session, { onSuccess: sessionLoaded, onError: sessionLoadError }),
]

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
          state: null,
        }
        const [authModel, authCmd] = initAuthenticated(session, location)
        return [authModel, Cmd.batch([authCmd, LocalStorage.setIgnoreErrors(SESSION_KEY, Session, session)])]
      }
      return [Model.Anonymous({ login: loginModel }), Cmd.map(login)(loginCmd)]
    },

    Logout: (): [Model, Cmd.Cmd<Msg>] => {
      const [anonModel, anonCmd] = initAnonymous()
      return [
        anonModel,
        Cmd.batch([
          anonCmd,
          LocalStorage.removeIgnoreErrors(SESSION_KEY),
          Http.send(Api.logout, { onSuccess: logoutCompleted, onError: logoutCompleted }),
        ]),
      ]
    },

    LogoutCompleted: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],

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
      const [screenModel, screenCmd] = startScreenWithAuth(route, location, config, model.screen)
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
  })

export const subscriptions = (_model: Model): Sub.Sub<Msg> => Sub.none

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Model.$match(model, {
      Initializing: () => <LoadingView />,
      Anonymous: ({ login: loginModel }) => Html.map(login)(Login.view(loginModel))(dispatch),
      Authenticated: m => (
        <Layout
          header={<AppHeader isOpen={m.navigation.isOpen} username={displayName(m.session)} dispatch={dispatch} />}
          nav={
            <AppNavigation
              model={m.navigation}
              selectedValue={selectedNavValue(m.screen)}
              selectedCategoryValue={selectedCategoryValue(m.screen)}
              dispatch={dispatch}
            />
          }
        >
          {Html.map(screen)(screenView(toAuthorizationConfig(m.session), m.screen))(dispatch)}
        </Layout>
      ),
    })

export const onUrlRequest = urlRequested
export const onUrlChange = urlChanged
