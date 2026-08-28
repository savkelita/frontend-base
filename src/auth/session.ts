import { Schema } from 'effect'
import { Korisnik, type LoginResponse } from './api/types'
import * as Uloga from './domain/uloga'
import type { AuthorizationConfig } from './types'

export const Session = Schema.Struct({
  korisnik: Korisnik,
  uloga: Uloga.ioValue,
  funkcionalnosti: Schema.Array(Schema.String),
})

export type Session = typeof Session.Type

export const SESSION_KEY = 'session'

export const fromLoginResponse = (response: LoginResponse, uloga: Uloga.Value): Session => ({
  korisnik: response.korisnik,
  uloga,
  funkcionalnosti: response.funkcionalnosti,
})

export const toAuthorizationConfig = (session: Session): AuthorizationConfig => ({
  funkcionalnosti: session.funkcionalnosti,
})

export const displayName = (session: Session): string => `${session.korisnik.ime} ${session.korisnik.prezime}`
