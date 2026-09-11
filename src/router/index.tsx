import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Sub from 'tea-effect/Sub'
import * as Navigation from 'tea-effect/Navigation'
import * as Http from 'tea-effect/Http'
import * as LocalStorage from 'tea-effect/LocalStorage'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { hasAllPermissions } from '../auth/types'
import { pocetnoPismo, postaviPismo, zapamti } from '../common/strings'
import type { Pismo } from '../common/strings'
import * as Api from '../auth/api'
import { SESIJA_KLJUC, izOdgovora, sSesija, toAuthorizationConfig } from '../auth/session'
import type { Sesija } from '../auth/session'
import * as SesijaUnit from '../auth/sesija'
import * as Artikal from '../artikal'
import * as ArtikalPregled from '../artikal/pregled'
import * as ArtikalPretraga from '../artikal/pretraga'
import * as Home from '../home'
import * as OtpremnicaStavke from '../otpremnica/stavke'
import * as Login from '../login'
import * as Nav from '../navigation'
import { parse as parseRoute, getRoutePermissions } from './route'
import type { Route } from './route'
import { Model, pismoIz } from './model'
import {
  Msg,
  urlRequested,
  urlChanged,
  screen,
  navigation,
  sesijaPotvrdjena,
  sesijaNijePotvrdjena,
  login,
  sesija as sesijaMsgWrap,
  logout,
} from './msg'
import {
  ScreenModel,
  artikalScreen,
  artikliScreen,
  homeScreen,
  otpremnicaStavkeScreen,
  notFoundScreen,
  unauthorizedScreen,
} from './screen-model'
import { ScreenMsg, artikalMsg, artikliMsg, homeMsg, otpremnicaStavkeMsg } from './screen-msg'
import { selectedNavValue, selectedCategoryValue } from './selected-nav'
import { Layout } from './components/layout'
import { NotFoundView } from './components/not-found-view'
import { UnauthorizedView } from './components/unauthorized-view'
import { AppHeader } from './components/app-header'
import { PismoSwitch } from './components/pismo-switch'
import { AppNavigation } from './components/app-navigation'
import { LoadingView } from './components/loading-view'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------

const locationToPath = (location: Navigation.Location): string => location.pathname + location.search + location.hash

const startScreen = (route: Route, location: Navigation.Location): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
  switch (route._tag) {
    case 'home': {
      const [model, cmd] = Home.init
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    }
    case 'otpremnicaStavke': {
      // Magacin i porudžbenica iza otpremnice inače dolaze sa same otpremnice; dok taj ekran
      // ne postoji, ovde su fiksirani.
      const [model, cmd] = OtpremnicaStavke.init(
        { otpremnicaID: route.params.otpremnicaID, magacinID: 1, porudzbenicaID: 42 },
        location.search,
      )
      return [otpremnicaStavkeScreen(model), Cmd.map(otpremnicaStavkeMsg)(cmd)]
    }
    case 'artikli': {
      const [model, cmd] = ArtikalPretraga.init(location.search)
      return [artikliScreen(model), Cmd.map(artikliMsg)(cmd)]
    }
    case 'artikal': {
      const [model, cmd] = ArtikalPregled.init(route.params.artikalID)
      return [artikalScreen(model), Cmd.map(artikalMsg)(cmd)]
    }
  }
}

const startScreenWithAuth = (
  route: Option.Option<Route>,
  location: Navigation.Location,
  config: ReturnType<typeof toAuthorizationConfig>,
): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  Option.match(route, {
    onNone: () => [notFoundScreen(location.pathname), Cmd.none],
    onSome: r => {
      const perms = getRoutePermissions(r._tag)
      if (!hasAllPermissions(config, perms)) return [unauthorizedScreen(location.pathname), Cmd.none]
      return startScreen(r, location)
    },
  })

const updateScreen = (msg: ScreenMsg, screenModel: ScreenModel): [ScreenModel, Cmd.Cmd<ScreenMsg>] =>
  ScreenMsg.$match(msg, {
    HomeMsg: ({ msg: homeMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'HomeScreen') return [screenModel, Cmd.none]
      const [model, cmd] = Home.update(homeMessage, screenModel.model)
      return [homeScreen(model), Cmd.map(homeMsg)(cmd)]
    },
    OtpremnicaStavkeMsg: ({ msg: stavkeMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'OtpremnicaStavkeScreen') return [screenModel, Cmd.none]
      const [model, cmd] = OtpremnicaStavke.update(stavkeMessage, screenModel.model)
      return [otpremnicaStavkeScreen(model), Cmd.map(otpremnicaStavkeMsg)(cmd)]
    },
    ArtikliMsg: ({ msg: artikliMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'ArtikliScreen') return [screenModel, Cmd.none]
      const [model, cmd] = ArtikalPretraga.update(artikliMessage, screenModel.model)
      return [artikliScreen(model), Cmd.map(artikliMsg)(cmd)]
    },
    ArtikalMsg: ({ msg: artikalMessage }): [ScreenModel, Cmd.Cmd<ScreenMsg>] => {
      if (screenModel._tag !== 'ArtikalScreen') return [screenModel, Cmd.none]
      const [model, cmd] = ArtikalPregled.update(artikalMessage, screenModel.model)
      return [artikalScreen(model), Cmd.map(artikalMsg)(cmd)]
    },
  })

// Права стижу до екрана овде, а не кроз модел: радње их траже при исцртавању дугмади, а
// сесија се у међувремену може обновити са другачијим скупом.
const screenView = (screenModel: ScreenModel, session: Sesija): TeaReact.Html<ScreenMsg> =>
  ScreenModel.$match(screenModel, {
    HomeScreen: ({ model }) => Html.map(homeMsg)(Home.view(model)),
    OtpremnicaStavkeScreen: ({ model }) => Html.map(otpremnicaStavkeMsg)(OtpremnicaStavke.view(model)),
    ArtikliScreen: ({ model }) =>
      Html.map(artikliMsg)(ArtikalPretraga.view(Artikal.authorization(toAuthorizationConfig(session)), model)),
    ArtikalScreen: ({ model }) =>
      Html.map(artikalMsg)(ArtikalPregled.view(Artikal.authorization(toAuthorizationConfig(session)), model)),
    NotFoundScreen:
      ({ path }) =>
      (_dispatch: Platform.Dispatch<ScreenMsg>) => <NotFoundView path={path} />,
    UnauthorizedScreen:
      ({ path }) =>
      (_dispatch: Platform.Dispatch<ScreenMsg>) => <UnauthorizedView path={path} />,
  })

const initAuthenticated = (session: Sesija, location: Navigation.Location, pismo: Pismo): [Model, Cmd.Cmd<Msg>] => {
  const config = toAuthorizationConfig(session)
  const route = parseRoute(location)
  const [screenModel, screenCmd] = startScreenWithAuth(route, location, config)
  const [navModel, navCmd] = Nav.init(config)
  return [
    Model.Authenticated({
      session,
      sesija: SesijaUnit.init(session),
      location,
      screen: screenModel,
      navigation: navModel,
      pismo,
    }),
    Cmd.batch([
      Cmd.map(screen)(screenCmd),
      Cmd.map(navigation)(navCmd),
      LocalStorage.setIgnoreErrors(SESIJA_KLJUC, sSesija, session),
    ]),
  ]
}

/** Одјава: сервер поништава колачић, кеш се брише, картице то виде кроз `storage`. */
const odjaviSe = (pismo: Pismo): [Model, Cmd.Cmd<Msg>] => {
  const [anonModel, anonCmd] = initAnonymous(pismo)
  return [
    anonModel,
    Cmd.batch([
      anonCmd,
      LocalStorage.removeIgnoreErrors(SESIJA_KLJUC),
      Http.send(Api.odjava(), { onSuccess: () => logout(), onError: () => logout() }),
    ]),
  ]
}

const initAnonymous = (pismo: Pismo): [Model, Cmd.Cmd<Msg>] => {
  const [loginModel, loginCmd] = Login.init
  return [Model.Anonymous({ login: loginModel, pismo }), Cmd.map(login)(loginCmd)]
}

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

// Колачић је истина, не кеш. Апликација при дизању увек пита сервер; кеш служи само за
// брзо прво исцртавање и као канал ка осталим картицама.
export const init = (location: Navigation.Location): [Model, Cmd.Cmd<Msg>] => [
  Model.Initializing({ location, pismo: pocetnoPismo() }),
  Http.send(Api.tekucaSesija(), { onSuccess: sesijaPotvrdjena, onError: sesijaNijePotvrdjena }),
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    SesijaPotvrdjena: ({ odgovor }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Initializing') return [model, Cmd.none]
      return initAuthenticated(izOdgovora(odgovor), model.location, model.pismo)
    },

    SesijaNijePotvrdjena: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Initializing') return [model, Cmd.none]
      const [anon, anonCmd] = initAnonymous(model.pismo)
      return [anon, Cmd.batch([anonCmd, LocalStorage.removeIgnoreErrors(SESIJA_KLJUC)])]
    },

    // Писмо се мења из било ког стања, и пре пријаве. Преференца се памти по уређају.
    PromeniPismo: ({ pismo }): [Model, Cmd.Cmd<Msg>] => [{ ...model, pismo } as Model, zapamti(pismo)],

    Login: ({ loginMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Anonymous') return [model, Cmd.none]
      const [loginModel, loginCmd] = Login.update(loginMsg, model.login)
      if (Option.isSome(loginModel.result)) {
        const location: Navigation.Location = { pathname: '/', search: '', hash: '', href: '/', origin: '' }
        return initAuthenticated(loginModel.result.value, location, model.pismo)
      }
      return [Model.Anonymous({ login: loginModel, pismo: model.pismo }), Cmd.map(login)(loginCmd)]
    },

    Logout: (): [Model, Cmd.Cmd<Msg>] => odjaviSe(pismoIz(model)),

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
      const [screenModel, screenCmd] = startScreenWithAuth(route, location, config)
      return [Model.Authenticated({ ...model, location, screen: screenModel }), Cmd.map(screen)(screenCmd)]
    },

    Screen: ({ screenMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const [screenModel, screenCmd] = updateScreen(screenMsg, model.screen)
      return [Model.Authenticated({ ...model, screen: screenModel }), Cmd.map(screen)(screenCmd)]
    },

    // Сесија сама не зна да преусмери на пријаву — то ради домаћин, по исходу.
    Sesija: ({ sesijaMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const [sesijaModel, sesijaCmd, ishod] = SesijaUnit.update(sesijaMsg, model.sesija)
      const dalje = Cmd.map(sesijaMsgWrap)(sesijaCmd)
      return SesijaUnit.Ishod.$match(ishod, {
        Nastavi: (): [Model, Cmd.Cmd<Msg>] => [Model.Authenticated({ ...model, sesija: sesijaModel }), dalje],
        Obnovljena: ({ sesija: nova }): [Model, Cmd.Cmd<Msg>] => [
          Model.Authenticated({ ...model, session: nova, sesija: sesijaModel }),
          Cmd.batch([dalje, LocalStorage.setIgnoreErrors(SESIJA_KLJUC, sSesija, nova)]),
        ],
        Zavrsena: (): [Model, Cmd.Cmd<Msg>] => odjaviSe(model.pismo),
      })
    },

    Navigation: ({ navMsg }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Authenticated') return [model, Cmd.none]
      const [navModel, navCmd] = Nav.update(navMsg, model.navigation)
      return [Model.Authenticated({ ...model, navigation: navModel }), Cmd.map(navigation)(navCmd)]
    },
  })

// -------------------------------------------------------------------------------------
// Subscriptions
// -------------------------------------------------------------------------------------

export const subscriptions = (model: Model): Sub.Sub<Msg> =>
  model._tag === 'Authenticated' ? Sub.map(sesijaMsgWrap)(SesijaUnit.subscriptions) : Sub.none

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

// Модел је извор истине за писмо; `t()` чита стање модула. Усклађивање стоји овде, једном,
// пре сваког исцртавања — тако се то двоје не могу разићи ни после промене ни после
// поновног дизања екрана.
export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => {
    postaviPismo(pismoIz(model))
    return Model.$match(model, {
      Initializing: () => <LoadingView />,
      Anonymous: ({ login: loginModel, pismo }) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
            <PismoSwitch pismo={pismo} dispatch={dispatch} />
          </div>
          {Html.map(login)(Login.view(loginModel))(dispatch)}
        </>
      ),
      Authenticated: m => (
        <Layout
          header={
            <AppHeader
              isOpen={m.navigation.isOpen}
              username={m.session.korisnickoIme}
              pismo={m.pismo}
              dispatch={dispatch}
            />
          }
          nav={
            <AppNavigation
              model={m.navigation}
              selectedValue={selectedNavValue(m.screen)}
              selectedCategoryValue={selectedCategoryValue(m.screen)}
              dispatch={dispatch}
            />
          }
        >
          {Html.map(screen)(screenView(m.screen, m.session))(dispatch)}
          {Html.map(sesijaMsgWrap)(SesijaUnit.view(m.sesija))(dispatch)}
        </Layout>
      ),
    })
  }

// -------------------------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------------------------

export const onUrlRequest = urlRequested

export const onUrlChange = urlChanged
