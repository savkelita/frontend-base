import { Data as Tagged } from 'effect'
import type { FormValue } from './model'

export type Msg = Tagged.TaggedEnum<{
  Changed: { readonly value: FormValue }
  Submitted: {}
  Cleared: {}
}>

export const Msg = Tagged.taggedEnum<Msg>()

export const changed = (value: FormValue): Msg => Msg.Changed({ value })

export const submitted = (): Msg => Msg.Submitted()

export const cleared = (): Msg => Msg.Cleared()
