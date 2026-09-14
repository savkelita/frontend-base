import { Data as Tagged } from 'effect'
import type { ApiError } from '../../error'
import type { Page } from '../../pretraga'
import type { Request } from './model'

export type Msg<A> = Tagged.TaggedEnum<{
  Opened: {}
  Closed: {}
  Typed: { readonly input: string }
  Applied: { readonly seq: number }
  More: {}
  Received: { readonly request: Request; readonly page: Page<A> }
  Failed: { readonly request: Request; readonly error: ApiError }
  Selected: { readonly values: ReadonlyArray<A> }
  Initialized: { readonly values: ReadonlyArray<A> }
}>

interface MsgDefinition extends Tagged.TaggedEnum.WithGenerics<1> {
  readonly taggedEnum: Msg<this['A']>
}

export const Msg = Tagged.taggedEnum<MsgDefinition>()

export const opened = <A>(): Msg<A> => Msg.Opened()

export const closed = <A>(): Msg<A> => Msg.Closed()

export const typed = <A>(input: string): Msg<A> => Msg.Typed({ input })

export const applied = <A>(seq: number): Msg<A> => Msg.Applied({ seq })

export const more = <A>(): Msg<A> => Msg.More()

export const received = <A>(request: Request, page: Page<A>): Msg<A> => Msg.Received({ request, page })

export const failed = <A>(request: Request, error: ApiError): Msg<A> => Msg.Failed({ request, error })

export const selected = <A>(values: ReadonlyArray<A>): Msg<A> => Msg.Selected({ values })

export const initialized = <A>(values: ReadonlyArray<A>): Msg<A> => Msg.Initialized({ values })
