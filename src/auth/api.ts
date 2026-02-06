import { Data } from 'effect'
import * as Task from 'tea-effect/Task'
import type { Session } from './session'

export type Credentials = {
  readonly username: string
  readonly password: string
}

export type LoginError = Data.TaggedEnum<{
  InvalidCredentials: {}
}>

export const LoginError = Data.taggedEnum<LoginError>()

const mockSession: Session = {
  token: 'mock-jwt-token-xyz',
  username: 'admin',
  permissions: ['home.view'],
}

export const login = (credentials: Credentials): Task.Task<Session, LoginError> => {
  if (credentials.username === 'admin' && credentials.password === 'admin') {
    return Task.succeed(mockSession)
  }
  return Task.fail(LoginError.InvalidCredentials())
}
