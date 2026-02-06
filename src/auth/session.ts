import { Schema } from 'effect'
import type { AuthorizationConfig } from './types'

export const Session = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.String,
  username: Schema.String,
  permissions: Schema.Array(Schema.String),
})

export type Session = typeof Session.Type

export const SESSION_KEY = 'session'

export const toAuthorizationConfig = (session: Session): AuthorizationConfig => ({
  permissions: [...session.permissions],
})
