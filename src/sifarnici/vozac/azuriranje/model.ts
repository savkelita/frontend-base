import { Data as Tagged, Equivalence, Option, Schema } from 'effect'
import type * as Combo from '../../../common/domain/combo'
import * as Email from '../../../common/domain/email'
import * as Name from '../../../common/domain/name'
import * as Telefon from '../../../common/domain/telefon'
import type { ApiError } from '../../../common/error'
import type { VozacInfo } from '../../api'
import * as Kategorija from '../../domain/kategorija-vozaca'
import * as StanjeVozaca from '../../domain/stanje-vozaca'

export type FormValue = {
  readonly ime: Name.Form
  readonly prezime: Name.Form
  readonly imeZaPrikaz: Name.Form
  readonly email: Email.Form
  readonly telefon: Telefon.Form
  readonly kategorije: Kategorija.FormMulti
  readonly stanje: StanjeVozaca.Form
}

export const vForm = () =>
  Schema.Struct({
    ime: Name.vForm,
    prezime: Name.vForm,
    imeZaPrikaz: Name.vForm,
    email: Schema.NullOr(Email.vForm),
    telefon: Schema.NullOr(Telefon.vForm),
    kategorije: Kategorija.vFormMulti,
    stanje: StanjeVozaca.vForm,
  })

export type Value = Schema.Schema.Type<ReturnType<typeof vForm>>

export const toForm = (vozac: VozacInfo): FormValue => ({
  ime: vozac.ime,
  prezime: vozac.prezime,
  imeZaPrikaz: vozac.imeZaPrikaz,
  email: vozac.email,
  telefon: vozac.telefon,
  kategorije: vozac.kategorije,
  stanje: vozac.stanje,
})

const ids = (kategorije: Kategorija.FormMulti): ReadonlyArray<number> =>
  [...kategorije.map(Kategorija.id)].sort((a, b) => a - b)

export const sameForm: Equivalence.Equivalence<FormValue> = Equivalence.struct({
  ime: Equivalence.strict<Name.Form>(),
  prezime: Equivalence.strict<Name.Form>(),
  imeZaPrikaz: Equivalence.strict<Name.Form>(),
  email: Equivalence.strict<Email.Form>(),
  telefon: Equivalence.strict<Telefon.Form>(),
  stanje: Equivalence.strict<StanjeVozaca.Form>(),
  kategorije: Equivalence.mapInput(Equivalence.array(Equivalence.number), ids),
})

export type Model = Tagged.TaggedEnum<{
  Loading: {}
  Ready: {
    readonly original: VozacInfo
    readonly value: FormValue
    readonly showErrors: boolean
    readonly isSubmitting: boolean
    readonly error: Option.Option<ApiError>
    readonly kategorijeCombo: Combo.Model<Kategorija.Value>
  }
  Failed: { readonly error: ApiError }
}>

export const Model = Tagged.taggedEnum<Model>()
