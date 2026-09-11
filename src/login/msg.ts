import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Sesija } from '../auth/session'

export type Msg = Data.TaggedEnum<{
  UsernameChanged: { readonly username: string }
  PasswordChanged: { readonly password: string }
  Submit: {}
  LoginSucceeded: { readonly sesija: Sesija }
  LoginFailed: { readonly error: Http.HttpError }
}>

export const Msg = Data.taggedEnum<Msg>()

export const usernameChanged = (username: string): Msg => Msg.UsernameChanged({ username })
export const passwordChanged = (password: string): Msg => Msg.PasswordChanged({ password })
export const submit = (): Msg => Msg.Submit()
export const loginSucceeded = (sesija: Sesija): Msg => Msg.LoginSucceeded({ sesija })
export const loginFailed = (error: Http.HttpError): Msg => Msg.LoginFailed({ error })
