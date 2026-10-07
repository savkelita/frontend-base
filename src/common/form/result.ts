import { Data as Tagged } from 'effect'
import * as Cmd from 'tea-effect/Cmd'

export type UpdateResult<Model, Msg, A> = Tagged.TaggedEnum<{
  Active: { readonly model: Model; readonly cmd: Cmd.Cmd<Msg> }
  Cancelled: {}
  Done: { readonly value: A }
}>

interface Definition extends Tagged.TaggedEnum.WithGenerics<3> {
  readonly taggedEnum: UpdateResult<this['A'], this['B'], this['C']>
}

const Enum = Tagged.taggedEnum<Definition>()

export const active = <Model, Msg, A>(model: Model, cmd: Cmd.Cmd<Msg> = Cmd.none): UpdateResult<Model, Msg, A> =>
  Enum.Active<Model, Msg, A>({ model, cmd })

export const cancelled = <Model, Msg, A>(): UpdateResult<Model, Msg, A> => Enum.Cancelled<Model, Msg, A>()

export const done = <Model, Msg, A>(value: A): UpdateResult<Model, Msg, A> => Enum.Done<Model, Msg, A>({ value })

export const matchResult = Enum.$match
