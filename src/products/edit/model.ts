import type { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ObjekatIdentifikator } from '../api'
import type { ProductEditFormModel } from './form'

// -------------------------------------------------------------------------------------
// Edit model — loads the record first (daj-info), then edits it
// -------------------------------------------------------------------------------------

export type LoadedModel = {
  readonly form: ProductEditFormModel
  readonly original: ObjekatIdentifikator
  readonly error: Option.Option<Http.HttpError>
}

export type Model =
  | { readonly status: 'Loading'; readonly id: number }
  | { readonly status: 'Ready'; readonly loaded: LoadedModel }
  | { readonly status: 'Failed'; readonly error: Http.HttpError }
