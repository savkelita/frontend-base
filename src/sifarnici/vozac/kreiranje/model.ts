import { Option, Schema } from 'effect'
import type * as Combo from '../../../common/domain/combo'
import * as Email from '../../../common/domain/email'
import * as Name from '../../../common/domain/name'
import type { ApiError } from '../../../common/error'
import * as Kategorija from '../../domain/kategorija-vozaca'

export type FormValue = {
  readonly ime: Name.Form
  readonly prezime: Name.Form
  readonly imeZaPrikaz: Name.Form
  readonly email: Email.Form
  readonly telefon: Name.Form
  readonly kategorije: Kategorija.FormMulti
}

export const vForm = () =>
  Schema.Struct({
    ime: Name.vForm,
    prezime: Name.vForm,
    imeZaPrikaz: Name.vForm,
    email: Schema.NullOr(Email.vForm),
    telefon: Schema.NullOr(Name.vForm),
    kategorije: Kategorija.vFormMulti,
  })

export type Value = Schema.Schema.Type<ReturnType<typeof vForm>>

export const EMPTY: FormValue = {
  ime: null,
  prezime: null,
  imeZaPrikaz: null,
  email: null,
  telefon: null,
  kategorije: [],
}

export type Model = {
  readonly value: FormValue
  readonly showErrors: boolean
  readonly isSubmitting: boolean
  readonly error: Option.Option<ApiError>
  readonly kategorijeCombo: Combo.Model<Kategorija.Value>
}
