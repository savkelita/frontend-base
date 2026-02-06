import { Schema } from 'effect'

// -------------------------------------------------------------------------------------
// Domain Types
// -------------------------------------------------------------------------------------

export type Credentials = {
  readonly username: string
  readonly password: string
}

// -------------------------------------------------------------------------------------
// Request Schemas
// -------------------------------------------------------------------------------------

export const LoginRequest = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  expiresInMins: Schema.Number,
})

export const RefreshRequest = Schema.Struct({
  refreshToken: Schema.String,
  expiresInMins: Schema.Number,
})

// -------------------------------------------------------------------------------------
// Response Schemas
// -------------------------------------------------------------------------------------

export const LoginResponse = Schema.Struct({
  id: Schema.Number,
  username: Schema.String,
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  gender: Schema.String,
  image: Schema.String,
  accessToken: Schema.String,
  refreshToken: Schema.String,
})

export const RefreshResponse = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.String,
})

export type RefreshResult = typeof RefreshResponse.Type
