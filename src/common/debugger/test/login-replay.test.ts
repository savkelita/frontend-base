// @vitest-environment happy-dom
import { ActionCreators, instrument, type LiftedStore } from '@redux-devtools/instrument'
import { Effect, Exit, Option, Scope } from 'effect'
import * as Jsan from 'jsan'
import type { UnknownAction } from 'redux'
import { afterEach, describe, expect, it } from 'vitest'
import type { Session } from '../../../auth/session'
import { PERMISSIONS } from '../../../auth/types'
import { changeKorisnik, submitKorisnik } from '../../../login/msg'
import * as App from '../../../router'
import { login, sessionLoaded } from '../../../router/msg'
import { REDACTED, program, serialize, tagPath, type Extension } from '../index'

type Lifted = LiftedStore<App.Model, UnknownAction, null>

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
  return { extension, listening: (): boolean => listeners > 0, store: (): Lifted => lifted[0]! }
}

const config = {
  init: App.init,
  update: App.update,
  view: App.view,
  subscriptions: App.subscriptions,
  onUrlRequest: App.onUrlRequest,
  onUrlChange: App.onUrlChange,
}

const scopes: Array<Scope.Closeable> = []

const start = async (extension: Extension) => {
  const scope = Effect.runSync(Scope.make())
  scopes.push(scope)
  const prog = await Effect.runPromise(
    Scope.provide(program(extension, { build: '0.1.0+test', maxAge: 200, actionsDenylist: [] }, config), scope),
  )
  const shown: Array<App.Model> = []
  prog.subscribe(model => void shown.push(Option.getOrElse(model.shown, () => model.app)))
  return { current: (): App.Model | undefined => shown[shown.length - 1] }
}

const session = (expiration: number): Session => ({
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: [...PERMISSIONS],
  expiration,
})

const until = async (condition: () => boolean): Promise<void> => {
  for (let i = 0; i < 200 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 5))
  expect(condition()).toBe(true)
}

const action = (msg: App.Msg): UnknownAction => ({ type: tagPath(msg), msg })

const exported = (actions: ReadonlyArray<UnknownAction>): string =>
  Jsan.stringify(actions, serialize.replacer, undefined, serialize.options)

const importedLikeExtension = (log: string): ReadonlyArray<UnknownAction> => {
  const value = Jsan.parse(log)
  if (!Array.isArray(value)) throw new Error('log nije lista akcija')
  return value
}

const lozinka = (model: App.Model | undefined): unknown =>
  model?._tag === 'Anonymous' && model.login.step._tag === 'Korisnik' ? model.login.step.form.lozinka : undefined

const submitted = (model: App.Model | undefined): boolean => model?._tag === 'Anonymous' && model.login.isSubmitting

afterEach(async () => {
  await Effect.runPromise(Effect.forEach(scopes.splice(0), scope => Scope.close(scope, Exit.void)))
})

describe('uvoz prijave', () => {
  it('prosirenje 3.2.10 uvozi bez revivera, a prijava se odigra sa zamaskiranom lozinkom', async () => {
    const log = exported([
      action(sessionLoaded(Option.none())),
      action(login(changeKorisnik({ korisnickoIme: 'pera', lozinka: 'tajna' }))),
      action(login(submitKorisnik())),
    ])
    const tools = devTools()
    const razvoj = await start(tools.extension)
    await until(tools.listening)

    expect(log).not.toContain('tajna')
    expect(() =>
      tools.store().dispatch(ActionCreators.importState<App.Model, UnknownAction>(importedLikeExtension(log))),
    ).not.toThrow()
    await until(() => submitted(razvoj.current()))

    expect(lozinka(razvoj.current())).toBe(REDACTED)
  })

  it('sesija iz loga ostaje prikazana i kad je istekla, a u ovom tabu niko nije prijavljen', async () => {
    const log = exported([action(sessionLoaded(Option.some(session(Date.now() - 1))))])
    const tools = devTools()
    const razvoj = await start(tools.extension)
    await until(tools.listening)

    tools.store().dispatch(ActionCreators.importState<App.Model, UnknownAction>(importedLikeExtension(log)))
    await until(() => razvoj.current()?._tag === 'Authenticated')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(razvoj.current()?._tag).toBe('Authenticated')
  })
})
