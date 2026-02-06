import { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Product } from './api'

export type Model = {
  readonly products: ReadonlyArray<Product>
  readonly isLoading: boolean
  readonly error: Option.Option<Http.HttpError>
}
