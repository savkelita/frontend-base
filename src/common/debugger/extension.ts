import { Option } from 'effect'
import type { StoreEnhancer } from 'redux'
import type { Serialize } from './serialize'

export type Options = {
  readonly build: string
  readonly maxAge: number
  readonly actionsDenylist: ReadonlyArray<string>
}

export type Features = {
  readonly pause: boolean
  readonly export: boolean | 'custom'
  readonly import: boolean | 'custom'
  readonly jump: boolean
  readonly skip: boolean
  readonly reorder: boolean
  readonly dispatch: boolean
  readonly test: boolean
}

export type Extension = (
  options: Omit<Options, 'build'> & { readonly features: Features; readonly serialize: Serialize },
) => StoreEnhancer

export const extension = (): Option.Option<Extension> =>
  Option.fromNullable(
    (globalThis as { readonly __REDUX_DEVTOOLS_EXTENSION__?: Extension }).__REDUX_DEVTOOLS_EXTENSION__,
  )
