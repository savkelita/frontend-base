import { Effect } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import { mapHttpError } from '../../error'
import { Data, sameRequest, type PretragaResponse } from '../../pretraga'
import { empty, toRequest, type Model, type Request } from './model'
import { Msg, applied, failed, initialized, received } from './msg'

export * from './form'
export * from './model'
export * from './msg'

const DEBOUNCE = '300 millis'

export type Source<A> = (request: Request) => Http.Request<PretragaResponse<A>>

const load = <A>(search: Source<A>, request: Request): Cmd.Cmd<Msg<A>> =>
  Http.send(search(request), {
    onSuccess: response => received<A>(request, { rows: response.result, total: response.total_ }),
    onError: error => failed<A>(request, mapHttpError(error)),
  })

const debounce = <A>(seq: number): Cmd.Cmd<Msg<A>> => Cmd.fromEffect(Effect.as(Effect.sleep(DEBOUNCE), applied<A>(seq)))

export const init = <A>(id: number | undefined, search: Source<A>): [Model<A>, Cmd.Cmd<Msg<A>>] => {
  if (id === undefined) return [empty<A>(), Cmd.none]
  return [
    empty<A>(),
    Http.send(search(toRequest(null, 0, id)), {
      onSuccess: response => initialized<A>(response.result),
      onError: () => initialized<A>([]),
    }),
  ]
}

export const update = <A>(search: Source<A>, msg: Msg<A>, model: Model<A>): [Model<A>, Cmd.Cmd<Msg<A>>] =>
  Msg.$match(msg, {
    Opened: (): [Model<A>, Cmd.Cmd<Msg<A>>] =>
      model.data === null
        ? [
            { ...model, open: true, data: Data.Loading<A>({ previous: null }) },
            load(search, toRequest(model.filter, 0)),
          ]
        : [{ ...model, open: true }, Cmd.none],

    Closed: (): [Model<A>, Cmd.Cmd<Msg<A>>] => [{ ...model, open: false }, Cmd.none],

    Typed: ({ input }): [Model<A>, Cmd.Cmd<Msg<A>>] => {
      const seq = model.seq + 1
      return [{ ...model, input, seq, open: true }, debounce<A>(seq)]
    },

    Applied: ({ seq }): [Model<A>, Cmd.Cmd<Msg<A>>] => {
      if (seq !== model.seq) return [model, Cmd.none]
      const filter = model.input === '' ? null : model.input
      return [{ ...model, filter, data: Data.Loading<A>({ previous: null }) }, load(search, toRequest(filter, 0))]
    },

    More: (): [Model<A>, Cmd.Cmd<Msg<A>>] => {
      if (model.data === null || model.data._tag !== 'Ready') return [model, Cmd.none]
      const page = model.data.page
      if (page.rows.length >= page.total) return [model, Cmd.none]
      return [
        { ...model, data: Data.Loading<A>({ previous: page }) },
        load(search, toRequest(model.filter, page.rows.length)),
      ]
    },

    Received: ({ request, page }): [Model<A>, Cmd.Cmd<Msg<A>>] => {
      if (model.data === null || model.data._tag !== 'Loading') return [model, Cmd.none]
      const previous = model.data.previous
      if (!sameRequest(toRequest(model.filter, previous === null ? 0 : previous.rows.length), request)) {
        return [model, Cmd.none]
      }
      const merged = previous === null ? page : { rows: [...previous.rows, ...page.rows], total: page.total }
      return [{ ...model, data: Data.Ready({ page: merged }) }, Cmd.none]
    },

    Failed: ({ request, error }): [Model<A>, Cmd.Cmd<Msg<A>>] => {
      if (model.data === null || model.data._tag !== 'Loading') return [model, Cmd.none]
      const previous = model.data.previous
      if (!sameRequest(toRequest(model.filter, previous === null ? 0 : previous.rows.length), request)) {
        return [model, Cmd.none]
      }
      return [{ ...model, data: Data.Failed<A>({ error }) }, Cmd.none]
    },

    Selected: (): [Model<A>, Cmd.Cmd<Msg<A>>] => [{ ...model, input: '' }, Cmd.none],

    Initialized: (): [Model<A>, Cmd.Cmd<Msg<A>>] => [model, Cmd.none],
  })
