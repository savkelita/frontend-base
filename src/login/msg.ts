import { Data } from 'effect'
import type { Uloge } from '../auth/domain/uloga'
import type { Session } from '../auth/session'
import type { ApiError } from '../common/error'
import type { FormKorisnik, FormUloga } from './model'

export type Msg = Data.TaggedEnum<{
  ChangeKorisnik: { readonly value: FormKorisnik }
  SubmitKorisnik: {}
  Identified: { readonly uloge: Uloge }
  IdentifyFailed: { readonly error: ApiError }
  ChangeUloga: { readonly value: FormUloga }
  SubmitUloga: {}
  LoginSucceeded: { readonly session: Session }
  LoginFailed: { readonly error: ApiError }
}>

export const Msg = Data.taggedEnum<Msg>()

export const changeKorisnik = (value: FormKorisnik): Msg => Msg.ChangeKorisnik({ value })
export const submitKorisnik = (): Msg => Msg.SubmitKorisnik()
export const identified = (uloge: Uloge): Msg => Msg.Identified({ uloge })
export const identifyFailed = (error: ApiError): Msg => Msg.IdentifyFailed({ error })
export const changeUloga = (value: FormUloga): Msg => Msg.ChangeUloga({ value })
export const submitUloga = (): Msg => Msg.SubmitUloga()
export const loginSucceeded = (session: Session): Msg => Msg.LoginSucceeded({ session })
export const loginFailed = (error: ApiError): Msg => Msg.LoginFailed({ error })
