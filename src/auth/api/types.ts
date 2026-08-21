import { Schema } from 'effect'
import * as Uloga from '../domain/uloga'

export const IdentifikujCmd = Schema.Struct({
  korisnickoIme: Schema.String,
  lozinka: Schema.String,
})

export type IdentifikujCmd = typeof IdentifikujCmd.Type

export const LoginCmd = Schema.Struct({
  uloga: Uloga.ioValue,
})

export const IdentifikujResponse = Schema.Struct({
  uloge: Schema.NonEmptyArray(Uloga.ioValue),
})

export const Korisnik = Schema.Struct({
  id: Schema.Number,
  ime: Schema.String,
  prezime: Schema.String,
  korisnickoIme: Schema.String,
  email: Schema.String,
})

export type Korisnik = typeof Korisnik.Type

export const LoginResponse = Schema.Struct({
  korisnik: Korisnik,
  funkcionalnosti: Schema.Array(Schema.String),
})

export type LoginResponse = typeof LoginResponse.Type
