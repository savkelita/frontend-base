import { Schema, type Equivalence } from 'effect'
import { Korisnik, type LoginResponse } from './api/types'
import * as Uloga from './domain/uloga'
import type { AuthorizationConfig } from './types'

export const Session = Schema.Struct({
  korisnik: Korisnik,
  uloga: Uloga.ioValue,
  funkcionalnosti: Schema.Array(Schema.String),
  expiration: Schema.Number,
})

export type Session = typeof Session.Type

export const SESSION_KEY = 'session'

export const fromLoginResponse = (response: LoginResponse, uloga: Uloga.Value, clientIssued: number): Session => ({
  korisnik: response.korisnik,
  uloga,
  funkcionalnosti: response.funkcionalnosti,
  expiration: clientIssued + (response.expiration.getTime() - response.issued.getTime()),
})

export const toAuthorizationConfig = (session: Session): AuthorizationConfig => ({
  permissions: session.funkcionalnosti,
})

export const sameIdentity: Equivalence.Equivalence<Session> = Schema.equivalence(Session.omit('expiration'))

export const canResume = (session: Session, now: number, hasCookie: boolean): boolean =>
  hasCookie && session.expiration > now

export const displayName = (session: Session): string => `${session.korisnik.ime} ${session.korisnik.prezime}`
