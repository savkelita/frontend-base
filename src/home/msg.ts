import { Data } from 'effect'

export type Msg = Data.TaggedEnum<{
  Increment: {}
  Decrement: {}
  Reset: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const increment = (): Msg => Msg.Increment()
export const decrement = (): Msg => Msg.Decrement()
export const reset = (): Msg => Msg.Reset()
