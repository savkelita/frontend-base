import { Option } from 'effect'
import type { StoreEnhancer } from 'redux'
import type { Serialize } from './serialize'

export type Options = {
  readonly build: string
  readonly maxAge: number
  readonly actionsDenylist: ReadonlyArray<string>
}

export type Extension = (options: Omit<Options, 'build'> & { readonly serialize: Serialize }) => StoreEnhancer

export const extension = (): Option.Option<Extension> =>
  Option.fromNullable(
    (globalThis as { readonly __REDUX_DEVTOOLS_EXTENSION__?: Extension }).__REDUX_DEVTOOLS_EXTENSION__,
  )
