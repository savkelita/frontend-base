import { Data } from 'effect'

export type Msg = Data.TaggedEnum<{
  Tick: { readonly now: number }
  SignOut: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const tick = (now: number): Msg => Msg.Tick({ now })

export const signOut = (): Msg => Msg.SignOut()
