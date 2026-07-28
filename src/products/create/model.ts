import type { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { CreatedProduct } from '../api'
import type { ProductFormModel } from './form'

export type Model = {
  readonly form: ProductFormModel
  readonly error: Option.Option<Http.HttpError>
  readonly saved: Option.Option<CreatedProduct>
}
