import { Data, Either } from 'effect'
import type { LoginError } from '../auth/api'
import type { Session } from '../auth/session'

export type Msg = Data.TaggedEnum<{
  UsernameChanged: { readonly username: string }
  PasswordChanged: { readonly password: string }
  Submit: {}
  LoginCompleted: { readonly result: Either.Either<Session, LoginError> }
}>

export const Msg = Data.taggedEnum<Msg>()

export const usernameChanged = (username: string): Msg => Msg.UsernameChanged({ username })
export const passwordChanged = (password: string): Msg => Msg.PasswordChanged({ password })
export const submit = (): Msg => Msg.Submit()
export const loginCompleted = (result: Either.Either<Session, LoginError>): Msg => Msg.LoginCompleted({ result })
