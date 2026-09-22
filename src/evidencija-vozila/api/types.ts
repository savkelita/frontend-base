import { Schema } from 'effect'
import { Audit } from '../../common/audit'
import { ioValue as ioDate } from '../../common/domain/date/api'
import { ioDatePredicate, ioEnumPredicate, ioId, ioStringPredicate } from '../../common/pretraga'
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

export const ioVoziloCriteria = Schema.Struct({
  registarskaOznaka: Schema.optional(ioStringPredicate),
  markaVozila: Schema.optional(ioStringPredicate),
  modelVozila: Schema.optional(ioStringPredicate),
  vrstaGorivaID: Schema.optional(ioId),
  vrstaVozilaID: Schema.optional(ioId),
  korisnikVozilaID: Schema.optional(ioId),
  vozacID: Schema.optional(ioId),
  datumPrveRegistracije: Schema.optional(ioDatePredicate),
  datumIsticanjaRegistracije: Schema.optional(ioDatePredicate),
  dostavljaMesecnuKm: Schema.optional(Schema.BooleanFromString),
  stanje: Schema.optional(ioEnumPredicate(VoziloStanje.ioValue)),
  istekRegistracije: Schema.optional(ioEnumPredicate(IstekRegistracije.ioValue)),
})

export type VoziloCriteria = typeof ioVoziloCriteria.Type
