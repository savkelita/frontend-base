import { Data } from 'effect'
import type { Values } from './model'

// One `FormChanged` carrying the WHOLE new `values` — never per-field messages. `Submit`
// triggers validation; `Submitted` is the follow-up dispatched by the submit Cmd on
// success (the typed Order travels through the Cmd, not the Model).
export type Msg = Data.TaggedEnum<{
  FormChanged: { readonly values: Values }
  Submit: {}
  Submitted: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const formChanged = (values: Values): Msg => Msg.FormChanged({ values })
export const submit = (): Msg => Msg.Submit()
export const submitted = (): Msg => Msg.Submitted()
