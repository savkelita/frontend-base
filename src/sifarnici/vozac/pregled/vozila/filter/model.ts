import { Schema } from 'effect'
import * as DateRange from '../../../../../common/domain/date-range'
import * as Name from '../../../../../common/domain/name'
import * as VoziloStanje from '../../../../../evidencija-vozila/domain/vozilo-stanje'

export type FormValue = {
  readonly registarskaOznaka: Name.Form
  readonly markaVozila: Name.Form
  readonly datumIsticanjaRegistracije: DateRange.Form | null
  readonly stanje: VoziloStanje.Form
}

export const vForm = () =>
  Schema.Struct({
    registarskaOznaka: Schema.NullOr(Name.vForm),
    markaVozila: Schema.NullOr(Name.vForm),
    datumIsticanjaRegistracije: Schema.NullOr(DateRange.vForm),
    stanje: Schema.NullOr(VoziloStanje.vForm),
  })

export type Model = {
  readonly value: FormValue
}
