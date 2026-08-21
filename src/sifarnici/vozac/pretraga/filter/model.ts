import { Schema } from 'effect'
import type * as Combo from '../../../../common/domain/combo'
import * as Name from '../../../../common/domain/name'
import * as Kategorija from '../../../domain/kategorija-vozaca'
import * as StanjeVozaca from '../../../domain/stanje-vozaca'

export type FormValue = {
  readonly ime: Name.Form
  readonly prezime: Name.Form
  readonly imeZaPrikaz: Name.Form
  readonly email: Name.Form
  readonly telefon: Name.Form
  readonly kategorija: Kategorija.Form
  readonly stanje: StanjeVozaca.Form
}

export const vForm = () =>
  Schema.Struct({
    ime: Schema.NullOr(Name.vForm),
    prezime: Schema.NullOr(Name.vForm),
    imeZaPrikaz: Schema.NullOr(Name.vForm),
    email: Schema.NullOr(Name.vForm),
    telefon: Schema.NullOr(Name.vForm),
    kategorija: Schema.NullOr(Kategorija.vForm),
    stanje: Schema.NullOr(StanjeVozaca.vForm),
  })

export type Model = {
  readonly value: FormValue
  readonly isOpen: boolean
  readonly kategorijaCombo: Combo.Model<Kategorija.Value>
}
