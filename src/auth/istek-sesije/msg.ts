import { Data } from 'effect'

export type Msg = Data.TaggedEnum<{
  Otkucaj: { readonly sada: number }
  Odjava: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const otkucaj = (sada: number): Msg => Msg.Otkucaj({ sada })

export const odjava = (): Msg => Msg.Odjava()
