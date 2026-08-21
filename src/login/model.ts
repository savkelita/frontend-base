import { Data, Option, Schema } from 'effect'
import * as Uloga from '../auth/domain/uloga'
import type { Session } from '../auth/session'
import * as Name from '../common/domain/name'
import type { ApiError } from '../common/error'

export type FormKorisnik = {
  readonly korisnickoIme: Name.Form
  readonly lozinka: Name.Form
}

export const vFormKorisnik = () =>
  Schema.Struct({
    korisnickoIme: Name.vForm,
    lozinka: Name.vForm,
  })

export const initialKorisnik: FormKorisnik = {
  korisnickoIme: null,
  lozinka: null,
}

export type FormUloga = {
  readonly uloga: Uloga.Form
}

export const vFormUloga = (uloge: ReadonlyArray<Uloga.Value>) => () =>
  Schema.Struct({
    uloga: Uloga.vForm(uloge),
  })

export const initialUloga: FormUloga = { uloga: null }

export type Step = Data.TaggedEnum<{
  Korisnik: { readonly form: FormKorisnik }
  Uloga: { readonly form: FormUloga; readonly uloge: Uloga.Uloge }
}>

export const Step = Data.taggedEnum<Step>()

export type Model = {
  readonly step: Step
  readonly showErrors: boolean
  readonly isSubmitting: boolean
  readonly error: Option.Option<ApiError>
  readonly result: Option.Option<Session>
}

export const initial: Model = {
  step: Step.Korisnik({ form: initialKorisnik }),
  showErrors: false,
  isSubmitting: false,
  error: Option.none(),
  result: Option.none(),
}
