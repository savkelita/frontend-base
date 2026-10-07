import { Data as Tagged } from 'effect'
import * as Cmd from 'tea-effect/Cmd'

export type Outcome<Model, Msg, A> = Tagged.TaggedEnum<{
  Active: { readonly model: Model; readonly cmd: Cmd.Cmd<Msg> }
  Closed: {}
  Done: { readonly value: A }
}>

interface Definition extends Tagged.TaggedEnum.WithGenerics<3> {
  readonly taggedEnum: Outcome<this['A'], this['B'], this['C']>
}

const Enum = Tagged.taggedEnum<Definition>()

export const active = <Model, Msg, A>(model: Model, cmd: Cmd.Cmd<Msg> = Cmd.none): Outcome<Model, Msg, A> =>
  Enum.Active<Model, Msg, A>({ model, cmd })

export const closed = <Model, Msg, A>(): Outcome<Model, Msg, A> => Enum.Closed<Model, Msg, A>()

export const done = <Model, Msg, A>(value: A): Outcome<Model, Msg, A> => Enum.Done<Model, Msg, A>({ value })

export const match = Enum.$match
