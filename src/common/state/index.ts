import * as Cmd from 'tea-effect/Cmd'

// -------------------------------------------------------------------------------------
// Стање екрана који прво учита запис
// -------------------------------------------------------------------------------------
//
// Исте три гране има свако ажурирање и сваки преглед, па стоје овде а не преписане по
// модулима. Имена су иста као у затеченом стеку (`Loading | Loaded | Failed`), као и
// `invalidUpdate`.

export type Load<A> =
  | { readonly _tag: 'Loading' }
  | { readonly _tag: 'Loaded'; readonly loaded: A }
  | { readonly _tag: 'Failed'; readonly message: string }

export const loading: Load<never> = { _tag: 'Loading' }

export const loaded = <A>(value: A): Load<A> => ({ _tag: 'Loaded', loaded: value })

export const failed = <A>(message: string): Load<A> => ({ _tag: 'Failed', message })

export const isLoaded = <A>(model: Load<A>): model is { readonly _tag: 'Loaded'; readonly loaded: A } =>
  model._tag === 'Loaded'

/** Учитана вредност, или `undefined` док је нема — за видове и предуслове. */
export const valueOf = <A>(model: Load<A>): A | undefined => (isLoaded(model) ? model.loaded : undefined)

/**
 * Порука која је стигла у стање у ком нема смисла. Затечени стек то исто ради у
 * `invalidUpdate`: упозори у конзоли и остави модел непромењен. Тихо гутање је горе —
 * грешка у ожичењу тако остане невидљива.
 */
export const invalidUpdate = <M>(model: M, msg: unknown): M => {
  console.warn('Неочекивана порука у текућем стању', { msg, model })
  return model
}

/**
 * Већина порука има смисла тек кад је запис учитан. Уместо да свака грана понавља проверу,
 * стоји овде — а стање у ком порука нема смисла се пријави, не прећути.
 *
 * Оно што се врати кад записа нема је увек исто: модел непромењен, без команде, уз неутралан
 * исход ако га `update` враћа. Зато се предаје само тај реп:
 *
 *   const onLoaded = State.onLoaded(model, msg, Outcome.Active())   // [model, cmd, outcome]
 *   const onLoaded = State.onLoaded(model, msg)                     // [model, cmd]
 */
export const onLoaded = <A, R extends readonly unknown[]>(model: Load<A>, msg: unknown, ...rep: R) => {
  const nepromenjeno = [model, Cmd.none, ...rep] as unknown as [Load<A>, Cmd.Cmd<never>, ...R]
  return <T extends [Load<A>, Cmd.Cmd<any>, ...R]>(f: (loaded: A) => T): T => {
    if (isLoaded(model)) return f(model.loaded)
    invalidUpdate(model, msg)
    return nepromenjeno as unknown as T
  }
}
