// @vitest-environment happy-dom
import { ActionCreators, instrument, type LiftedStore } from '@redux-devtools/instrument'
import { Data, Effect, Exit, Scope } from 'effect'
import * as Jsan from 'jsan'
import type { UnknownAction } from 'redux'
import * as Cmd from 'tea-effect/Cmd'
import * as Sub from 'tea-effect/Sub'
import { afterEach, describe, expect, it } from 'vitest'
import { app, program, serialize, type Extension } from '../index'

type Counted = Data.TaggedEnum<{ Incremented: {}; Doubled: {}; Echoed: {}; Navigated: {} }>

const Counted = Data.taggedEnum<Counted>()

type Counter = { readonly count: number }

const counter = {
  init: (): [Counter, Cmd.Cmd<Counted>] => [{ count: 0 }, Cmd.none],
  update: (msg: Counted, model: Counter): [Counter, Cmd.Cmd<Counted>] =>
    Counted.$match(msg, {
      Incremented: (): [Counter, Cmd.Cmd<Counted>] => [{ count: model.count + 1 }, Cmd.none],
      Doubled: (): [Counter, Cmd.Cmd<Counted>] => [{ count: model.count * 2 }, Cmd.none],
      Echoed: (): [Counter, Cmd.Cmd<Counted>] => [model, Cmd.of(Counted.Incremented())],
      Navigated: (): [Counter, Cmd.Cmd<Counted>] => [model, Cmd.none],
    }),
  view: () => () => null,
  subscriptions: () => Sub.none,
  onUrlRequest: () => Counted.Navigated(),
  onUrlChange: () => Counted.Navigated(),
}

type Lifted = LiftedStore<Counter, UnknownAction, null>

const devTools = () => {
  const lifted: Array<Lifted> = []
  let listeners = 0
  const extension: Extension = options => next => (reducer, preloadedState) => {
    const store = instrument(undefined, { maxAge: options.maxAge })(next)(reducer, preloadedState)
    lifted.push(store.liftedStore)
    return {
      ...store,
      subscribe: listener => {
        listeners += 1
        return store.subscribe(listener)
      },
    }
  }
  return {
    extension,
    listening: (): boolean => listeners > 0,
    store: (): Lifted => lifted[0]!,
  }
}

const types = (store: Lifted): ReadonlyArray<string> =>
  store
    .getState()
    .stagedActionIds.slice(1)
    .map(id => store.getState().actionsById[id]!.action.type)

const counts = (store: Lifted): ReadonlyArray<number> => store.getState().computedStates.map(entry => entry.state.count)

const actions = (store: Lifted): ReadonlyArray<UnknownAction> =>
  store
    .getState()
    .stagedActionIds.slice(1)
    .map(id => store.getState().actionsById[id]!.action)

const parsed = (log: string): ReadonlyArray<UnknownAction> => {
  const value = Jsan.parse(log, serialize.reviver)
  if (!Array.isArray(value)) throw new Error('log nije lista akcija')
  return value
}

const scopes: Array<Scope.CloseableScope> = []

const builds = (store: Lifted): ReadonlyArray<unknown> => actions(store).map(action => action.build)

const start = async (extension: Extension, build = '1.0.0+test') => {
  const scope = Effect.runSync(Scope.make())
  scopes.push(scope)
  const prog = await Effect.runPromise(
    Scope.extend(program(extension, { build, maxAge: 50, actionsDenylist: [] }, counter), scope),
  )
  const models: Array<Counter> = []
  prog.subscribe(model => void models.push(model.app))
  return {
    dispatch: (msg: Counted): void => prog.dispatch(app(msg)),
    current: (): Counter | undefined => models[models.length - 1],
  }
}

const until = async (condition: () => boolean): Promise<void> => {
  for (let i = 0; i < 200 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 5))
  expect(condition()).toBe(true)
}

afterEach(async () => {
  await Effect.runPromise(Effect.forEach(scopes.splice(0), scope => Scope.close(scope, Exit.void)))
})

describe('istorija u Redux DevTools', () => {
  it('svaka poruka ulazi pod putanjom tagova, sa modelom koji aplikacija vec ima', async () => {
    const tools = devTools()
    const { dispatch, current } = await start(tools.extension)

    dispatch(Counted.Incremented())
    dispatch(Counted.Doubled())

    expect(types(tools.store())).toStrictEqual(['Incremented', 'Doubled'])
    expect(counts(tools.store())).toStrictEqual([0, 1, 2])
    expect(tools.store().getState().computedStates[2]?.state).toBe(current())
  })

  it('svaka akcija nosi build, pa se zna na kojoj verziji je log nastao i kad DevTools odbaci pocetak', async () => {
    const tools = devTools()
    const { dispatch } = await start(tools.extension, '0.1.0+61dbe74')

    dispatch(Counted.Incremented())
    dispatch(Counted.Doubled())

    expect(builds(tools.store())).toStrictEqual(['0.1.0+61dbe74', '0.1.0+61dbe74'])
  })

  it('skok vraca aplikaciju u izabrano stanje i ne pravi novu akciju', async () => {
    const tools = devTools()
    const { dispatch, current } = await start(tools.extension)
    dispatch(Counted.Incremented())
    dispatch(Counted.Doubled())
    await until(tools.listening)

    tools.store().dispatch(ActionCreators.jumpToAction(1))
    await until(() => current()?.count === 1)

    expect(types(tools.store())).toStrictEqual(['Incremented', 'Doubled'])
  })

  it('posle skoka nova poruka ide na kraj istorije, a prikaz ostaje na izabranom stanju', async () => {
    const tools = devTools()
    const { dispatch, current } = await start(tools.extension)
    dispatch(Counted.Incremented())
    dispatch(Counted.Doubled())
    await until(tools.listening)
    tools.store().dispatch(ActionCreators.jumpToAction(1))
    await until(() => current()?.count === 1)

    dispatch(Counted.Incremented())
    await until(() => current()?.count === 1)

    expect(counts(tools.store())).toStrictEqual([0, 1, 2, 3])
  })

  it('preskocena poruka ispada, a aplikacija dobija stanje izracunato bez nje', async () => {
    const tools = devTools()
    const { dispatch, current } = await start(tools.extension)
    dispatch(Counted.Incremented())
    dispatch(Counted.Doubled())
    dispatch(Counted.Incremented())
    await until(tools.listening)

    tools.store().dispatch(ActionCreators.toggleAction(1))

    await until(() => current()?.count === 1)
  })

  it('zakljucan DevTools vraca aplikaciju na zakljucano stanje', async () => {
    const tools = devTools()
    const { dispatch, current } = await start(tools.extension)
    dispatch(Counted.Incremented())
    await until(tools.listening)
    tools.store().dispatch(ActionCreators.lockChanges(true))

    dispatch(Counted.Incremented())

    await until(() => current()?.count === 1)
    expect(types(tools.store())).toStrictEqual(['Incremented'])
  })

  it('uvezen log se odigrava kroz update aplikacije, bez komandi, i cuva build korisnika', async () => {
    const user = devTools()
    const korisnik = await start(user.extension, '0.1.0+korisnik')
    korisnik.dispatch(Counted.Incremented())
    korisnik.dispatch(Counted.Echoed())
    await until(() => korisnik.current()?.count === 2)
    korisnik.dispatch(Counted.Doubled())
    const log = Jsan.stringify(actions(user.store()), serialize.replacer, undefined, serialize.options)

    const developer = devTools()
    const razvoj = await start(developer.extension, '0.1.0+razvoj')
    await until(developer.listening)
    developer.store().dispatch(ActionCreators.importState<Counter, UnknownAction>(parsed(log)))

    await until(() => razvoj.current()?.count === 4)
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(razvoj.current()?.count).toBe(4)
    expect(types(developer.store())).toStrictEqual(['Incremented', 'Echoed', 'Incremented', 'Doubled'])
    expect(new Set(builds(developer.store()))).toStrictEqual(new Set(['0.1.0+korisnik']))
  })
})
