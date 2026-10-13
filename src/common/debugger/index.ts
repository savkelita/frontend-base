import { Effect, Option, type Scope } from 'effect'
import { legacy_createStore, type UnknownAction } from 'redux'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Navigation from 'tea-effect/Navigation'
import * as Sub from 'tea-effect/Sub'
import type { Extension, Options } from './extension'
import type { Model } from './model'
import { Msg, app, jumped } from './msg'
import { revive, serialize } from './serialize'
import { tagPath } from './tag-path'

export * from './extension'
export * from './model'
export * from './msg'
export * from './serialize'
export * from './tag-path'

type Step<AppModel, AppMsg> = {
  readonly from: AppModel
  readonly msg: AppMsg
  readonly to: AppModel
}

const isAction = <AppMsg>(action: UnknownAction): action is UnknownAction & { readonly msg: AppMsg } => 'msg' in action

export const update = <AppModel, AppMsg>(
  appUpdate: (msg: AppMsg, model: AppModel) => readonly [AppModel, Cmd.Cmd<AppMsg>],
  msg: Msg<AppModel, AppMsg>,
  model: Model<AppModel, AppMsg>,
): [Model<AppModel, AppMsg>, Cmd.Cmd<Msg<AppModel, AppMsg>>] =>
  Msg.$match(msg, {
    App: ({ msg: appMsg }): [Model<AppModel, AppMsg>, Cmd.Cmd<Msg<AppModel, AppMsg>>] => {
      const [next, cmd] = appUpdate(appMsg, model.app)
      return [{ app: next, last: Option.some(appMsg) }, Cmd.map<AppMsg, Msg<AppModel, AppMsg>>(app)(cmd)]
    },
    Jumped: ({ model: target }): [Model<AppModel, AppMsg>, Cmd.Cmd<Msg<AppModel, AppMsg>>] => [
      { app: target, last: Option.none() },
      Cmd.none,
    ],
  })

export const program = <AppModel, AppMsg extends { readonly _tag: string }, Dom>(
  extension: Extension,
  options: Options,
  config: Required<Navigation.ProgramConfig<AppModel, AppMsg, Dom>>,
): Effect.Effect<Html.Program<Model<AppModel, AppMsg>, Msg<AppModel, AppMsg>, Dom>, never, Scope.Scope> =>
  Effect.suspend(() => {
    const [initial, initialCmd] = config.init(Navigation.getLocation())
    let current = initial
    let taken: Step<AppModel, AppMsg> | null = null

    const reducer = (state: AppModel = initial, action: UnknownAction): AppModel => {
      if (!isAction<AppMsg>(action)) return revive(state)
      if (taken !== null && taken.from === state && taken.msg === action.msg) return taken.to
      return config.update(revive(action.msg), state)[0]
    }

    const { build, ...devTools } = options
    const store = legacy_createStore(reducer, initial, extension({ ...devTools, serialize }))

    const observe = (model: Model<AppModel, AppMsg>): void => {
      const from = current
      current = model.app
      if (Option.isNone(model.last)) return
      const msg = model.last.value
      taken = { from, msg, to: model.app }
      store.dispatch({ type: tagPath(msg), build, msg })
      taken = null
    }

    const jumps = Sub.fromCallback<Msg<AppModel, AppMsg>>(
      emit =>
        store.subscribe(() => {
          const state = store.getState()
          if (state !== current) emit(jumped<AppModel, AppMsg>(revive(state)))
        }),
      'redux-devtools',
    )

    const instrumented = Navigation.program<Model<AppModel, AppMsg>, Msg<AppModel, AppMsg>, Dom>({
      init: () => [{ app: initial, last: Option.none() }, Cmd.map<AppMsg, Msg<AppModel, AppMsg>>(app)(initialCmd)],
      update: (msg, model) => update(config.update, msg, model),
      view: model => Html.map<AppMsg, Msg<AppModel, AppMsg>>(app)(config.view(model.app)),
      subscriptions: model =>
        Sub.batch([Sub.map<AppMsg, Msg<AppModel, AppMsg>>(app)(config.subscriptions(model.app)), jumps]),
      onUrlRequest: request => app<AppModel, AppMsg>(config.onUrlRequest(request)),
      onUrlChange: location => app<AppModel, AppMsg>(config.onUrlChange(location)),
    })

    return Effect.tap(instrumented, prog =>
      Effect.acquireRelease(
        Effect.sync(() => prog.subscribe(observe)),
        unsubscribe => Effect.sync(unsubscribe),
      ),
    )
  })
