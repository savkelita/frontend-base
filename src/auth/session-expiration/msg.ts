import { Data } from 'effect'

export type Msg = Data.TaggedEnum<{
  Tick: { readonly now: number; readonly hasCookie: boolean }
  SignOut: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const tick = (now: number, hasCookie: boolean): Msg => Msg.Tick({ now, hasCookie })

export const signOut = (): Msg => Msg.SignOut()
