import { Schema } from 'effect'
import type * as Combo from '../../../../common/domain/combo'
import * as EnumFilter from '../../../../common/pretraga/filter-enum'
import * as TextFilter from '../../../../common/pretraga/filter-text'
import * as Kategorija from '../../../domain/kategorija-vozaca'
import * as StanjeVozaca from '../../../domain/stanje-vozaca'

export type FormValue = {
  readonly ime: TextFilter.Form
  readonly prezime: TextFilter.Form
  readonly imeZaPrikaz: TextFilter.Form
  readonly email: TextFilter.Form
  readonly telefon: TextFilter.Form
  readonly kategorija: Kategorija.Form
  readonly stanje: EnumFilter.Form<StanjeVozaca.Value>
}

export const vForm = () =>
  Schema.Struct({
    ime: TextFilter.vForm(),
    prezime: TextFilter.vForm(),
    imeZaPrikaz: TextFilter.vForm(),
    email: TextFilter.vForm(),
    telefon: TextFilter.vForm(),
    kategorija: Schema.NullOr(Kategorija.vForm),
    stanje: EnumFilter.vForm(StanjeVozaca.KEYS),
  })

export type Model = {
  readonly value: FormValue
  readonly isOpen: boolean
  readonly kategorijaCombo: Combo.Model<Kategorija.Value>
}
