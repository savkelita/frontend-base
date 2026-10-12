import { Schema } from 'effect'
import * as DateFilter from '../../../../../common/pretraga/filter-date'
import * as EnumFilter from '../../../../../common/pretraga/filter-enum'
import * as TextFilter from '../../../../../common/pretraga/filter-text'
import { OZNAKA_OPERATORI } from '../../../../../evidencija-vozila/api'
import * as VoziloStanje from '../../../../../evidencija-vozila/domain/vozilo-stanje'

export type FormValue = {
  readonly registarskaOznaka: TextFilter.Form
  readonly markaVozila: TextFilter.Form
  readonly datumIsticanjaRegistracije: DateFilter.Form
  readonly stanje: EnumFilter.Form<VoziloStanje.Value>
}

export const vForm = () =>
  Schema.Struct({
    registarskaOznaka: TextFilter.vForm(OZNAKA_OPERATORI),
    markaVozila: TextFilter.vForm(),
    datumIsticanjaRegistracije: DateFilter.vForm(),
    stanje: EnumFilter.vForm(VoziloStanje.KEYS),
  })

export type Model = {
  readonly value: FormValue
}
