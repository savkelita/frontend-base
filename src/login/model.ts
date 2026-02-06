import { Option } from 'effect'
import type { LoginError } from '../auth/api'
import type { Session } from '../auth/session'

export type Model = {
  readonly username: string
  readonly password: string
  readonly isSubmitting: boolean
  readonly error: Option.Option<LoginError>
  readonly result: Option.Option<Session>
}
