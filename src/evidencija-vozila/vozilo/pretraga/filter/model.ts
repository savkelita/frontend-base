import { Schema } from 'effect'
import * as BooleanDomain from '../../../../common/domain/boolean'
import type * as Combo from '../../../../common/domain/combo'
import * as DateFilter from '../../../../common/pretraga/filter-date'
import * as EnumFilter from '../../../../common/pretraga/filter-enum'
import * as TextFilter from '../../../../common/pretraga/filter-text'
import * as KorisnikVozila from '../../../../sifarnici/domain/korisnik-vozila'
import * as MarkaVozila from '../../../../sifarnici/domain/marka-vozila'
import * as ModelVozila from '../../../../sifarnici/domain/model-vozila'
import * as Vozac from '../../../../sifarnici/domain/vozac'
import * as VrstaGoriva from '../../../../sifarnici/domain/vrsta-goriva'
import * as VrstaVozila from '../../../../sifarnici/domain/vrsta-vozila'
import * as Api from '../../../api'
import * as IstekRegistracije from '../../../domain/istek-registracije'
import * as VoziloStanje from '../../../domain/vozilo-stanje'

export type FormValue = {
  readonly registarskaOznaka: TextFilter.Form
  readonly markaVozila: MarkaVozila.Form
  readonly modelVozila: ModelVozila.Form
  readonly vrstaGoriva: VrstaGoriva.Form
  readonly vrstaVozila: VrstaVozila.Form
  readonly korisnikVozila: KorisnikVozila.Form
  readonly vozac: Vozac.Form
  readonly datumPrveRegistracije: DateFilter.Form
  readonly datumIsticanjaRegistracije: DateFilter.Form
  readonly dostavljaMesecnuKm: BooleanDomain.Form
  readonly stanje: EnumFilter.Form<VoziloStanje.Value>
  readonly istekRegistracije: EnumFilter.Form<IstekRegistracije.Value>
}

export const vForm = () =>
  Schema.Struct({
    registarskaOznaka: TextFilter.vForm(Api.OZNAKA_OPERATORI),
    markaVozila: Schema.NullOr(MarkaVozila.vForm),
    modelVozila: Schema.NullOr(ModelVozila.vForm),
    vrstaGoriva: Schema.NullOr(VrstaGoriva.vForm),
    vrstaVozila: Schema.NullOr(VrstaVozila.vForm),
    korisnikVozila: Schema.NullOr(KorisnikVozila.vForm),
    vozac: Schema.NullOr(Vozac.vForm),
    datumPrveRegistracije: DateFilter.vForm(),
    datumIsticanjaRegistracije: DateFilter.vForm(),
    dostavljaMesecnuKm: Schema.NullOr(BooleanDomain.vForm),
    stanje: EnumFilter.vForm(VoziloStanje.KEYS),
    istekRegistracije: EnumFilter.vForm(IstekRegistracije.KEYS),
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
