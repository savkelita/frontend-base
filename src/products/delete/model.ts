import { Option } from 'effect'
import type * as Http from 'tea-effect/Http'

export type Model = {
  readonly deleting: boolean
  readonly error: Option.Option<Http.HttpError>
}

export const init: Model = { deleting: false, error: Option.none() }
