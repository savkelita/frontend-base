import { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Product } from './api'
import type * as Delete from './delete'
import type * as Edit from './edit'

export type Deleting = {
  readonly id: number
  readonly title: string
  readonly model: Delete.Model
}

export type Editing = {
  readonly model: Edit.Model
}

export type Model = {
  readonly products: ReadonlyArray<Product>
  readonly isLoading: boolean
  readonly error: Option.Option<Http.HttpError>
  /** The edit dialog, when open. */
  readonly editing: Option.Option<Editing>
  /** The delete confirmation dialog, when open. */
  readonly deleting: Option.Option<Deleting>
}
