import { Schema } from 'effect'
import { Audit } from '../../common/audit'
import { ioValue as ioDate } from '../../common/domain/date/api'
import type { DatePredicate, EnumPredicate, StringPredicate } from '../../common/pretraga'
import * as IstekRegistracije from '../domain/istek-registracije'
import * as VoziloStanje from '../domain/vozilo-stanje'

export const Vozilo = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
  registarskaOznaka: Schema.String,
  datumPrveRegistracije: Schema.NullOr(ioDate),
  datumIsticanjaRegistracije: Schema.NullOr(ioDate),
  markaVozila: Schema.String,
  modelVozila: Schema.String,
  vrstaGorivaNaziv: Schema.String,
  vrstaVozilaNaziv: Schema.String,
  vozacIme: Schema.NullOr(Schema.String),
  vozacPrezime: Schema.NullOr(Schema.String),
  korisnikVozilaNaziv: Schema.NullOr(Schema.String),
  dostavljaMesecnuKm: Schema.Boolean,
  napomena: Schema.NullOr(Schema.String),
  stanje: VoziloStanje.ioValue,
  audit: Audit,
})

export type Vozilo = typeof Vozilo.Type

export const ioVoziloOrder = Schema.Literal(
  'registarskaOznaka',
  'datumPrveRegistracije',
  'datumIsticanjaRegistracije',
  'markaVozila',
  'modelVozila',
  'vrstaGorivaNaziv',
  'vrstaVozilaNaziv',
  'vozacIme',
  'vozacPrezime',
  'korisnikVozilaNaziv',
  'dostavljaMesecnuKm',
  'stanje',
)

export type VoziloOrder = typeof ioVoziloOrder.Type

export type VoziloCriteria = {
  readonly registarskaOznaka?: StringPredicate
  readonly markaVozila?: StringPredicate
  readonly modelVozila?: StringPredicate
  readonly vrstaGorivaID?: number
  readonly vrstaVozilaID?: number
  readonly korisnikVozilaID?: number
  readonly vozacID?: number
  readonly datumPrveRegistracije?: DatePredicate
  readonly datumIsticanjaRegistracije?: DatePredicate
  readonly dostavljaMesecnuKm?: boolean
  readonly stanje?: EnumPredicate<VoziloStanje.Value>
  readonly istekRegistracije?: EnumPredicate<IstekRegistracije.Value>
}
