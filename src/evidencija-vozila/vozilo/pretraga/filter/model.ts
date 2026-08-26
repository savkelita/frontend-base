import { Schema } from 'effect'
import * as BooleanDomain from '../../../../common/domain/boolean'
import * as Code30 from '../../../../common/domain/code30'
import type * as Combo from '../../../../common/domain/combo'
import * as DateRange from '../../../../common/domain/date-range'
import * as KorisnikVozila from '../../../../sifarnici/domain/korisnik-vozila'
import * as MarkaVozila from '../../../../sifarnici/domain/marka-vozila'
import * as ModelVozila from '../../../../sifarnici/domain/model-vozila'
import * as Vozac from '../../../../sifarnici/domain/vozac'
import * as VrstaGoriva from '../../../../sifarnici/domain/vrsta-goriva'
import * as VrstaVozila from '../../../../sifarnici/domain/vrsta-vozila'
import * as IstekRegistracije from '../../../domain/istek-registracije'
import * as VoziloStanje from '../../../domain/vozilo-stanje'

export type FormValue = {
  readonly registarskaOznaka: Code30.Form
  readonly markaVozila: MarkaVozila.Form
  readonly modelVozila: ModelVozila.Form
  readonly vrstaGoriva: VrstaGoriva.Form
  readonly vrstaVozila: VrstaVozila.Form
  readonly korisnikVozila: KorisnikVozila.Form
  readonly vozac: Vozac.Form
  readonly datumPrveRegistracije: DateRange.Form | null
  readonly datumIsticanjaRegistracije: DateRange.Form | null
  readonly dostavljaMesecnuKm: BooleanDomain.Form
  readonly stanje: VoziloStanje.Form
  readonly istekRegistracije: IstekRegistracije.Form
}

export const vForm = () =>
  Schema.Struct({
    registarskaOznaka: Schema.NullOr(Code30.vForm),
    markaVozila: Schema.NullOr(MarkaVozila.vForm),
    modelVozila: Schema.NullOr(ModelVozila.vForm),
    vrstaGoriva: Schema.NullOr(VrstaGoriva.vForm),
    vrstaVozila: Schema.NullOr(VrstaVozila.vForm),
    korisnikVozila: Schema.NullOr(KorisnikVozila.vForm),
    vozac: Schema.NullOr(Vozac.vForm),
    datumPrveRegistracije: Schema.NullOr(DateRange.vForm),
    datumIsticanjaRegistracije: Schema.NullOr(DateRange.vForm),
    dostavljaMesecnuKm: Schema.NullOr(BooleanDomain.vForm),
    stanje: Schema.NullOr(VoziloStanje.vForm),
    istekRegistracije: Schema.NullOr(IstekRegistracije.vForm),
  })

export type Model = {
  readonly value: FormValue
  readonly isOpen: boolean
  readonly markaCombo: Combo.Model<MarkaVozila.Value>
  readonly modelCombo: Combo.Model<ModelVozila.Value>
  readonly vrstaGorivaCombo: Combo.Model<VrstaGoriva.Value>
  readonly vrstaVozilaCombo: Combo.Model<VrstaVozila.Value>
  readonly korisnikVozilaCombo: Combo.Model<KorisnikVozila.Value>
  readonly vozacCombo: Combo.Model<Vozac.Value>
}
