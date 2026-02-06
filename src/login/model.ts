import { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Session } from '../auth/session'

export type Model = {
  readonly username: string
  readonly password: string
  readonly isSubmitting: boolean
  readonly error: Option.Option<Http.HttpError>
  readonly result: Option.Option<Session>
}
