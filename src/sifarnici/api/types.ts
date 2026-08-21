import { Schema } from 'effect'
import type { EnumPredicate, StringPredicate } from '../../common/pretraga'
import * as StanjeVozaca from '../domain/stanje-vozaca'

export const KategorijaVozacaInfo = Schema.Struct({
  id: Schema.Number,
  oznaka: Schema.String,
})

export type KategorijaVozacaInfo = typeof KategorijaVozacaInfo.Type

export const KategorijaVozackeDozvoleCombo = Schema.Struct({
  id: Schema.Number,
  oznaka: Schema.String,
})

export type KategorijaVozackeDozvoleCombo = typeof KategorijaVozackeDozvoleCombo.Type

export const Vozac = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
  ime: Schema.String,
  prezime: Schema.String,
  imeZaPrikaz: Schema.String,
  email: Schema.NullOr(Schema.String),
  telefon: Schema.NullOr(Schema.String),
  kategorije: Schema.Array(KategorijaVozacaInfo),
  stanje: StanjeVozaca.ioValue,
})

export type Vozac = typeof Vozac.Type

export const VozacInfo = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
  ime: Schema.String,
  prezime: Schema.String,
  imeZaPrikaz: Schema.String,
  email: Schema.NullOr(Schema.String),
  telefon: Schema.NullOr(Schema.String),
  kategorije: Schema.Array(KategorijaVozacaInfo),
  stanje: StanjeVozaca.ioValue,
})

export type VozacInfo = typeof VozacInfo.Type

export const AzurirajVozacCmd = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
  prezime: Schema.String,
  ime: Schema.String,
  imeZaPrikaz: Schema.String,
  email: Schema.NullOr(Schema.String),
  telefon: Schema.NullOr(Schema.String),
  stanje: StanjeVozaca.ioValue,
  kategorije: Schema.Array(Schema.Number),
})

export type AzurirajVozacCmd = typeof AzurirajVozacCmd.Type

export const KreirajVozacCmd = Schema.Struct({
  prezime: Schema.String,
  ime: Schema.String,
  imeZaPrikaz: Schema.String,
  email: Schema.NullOr(Schema.String),
  telefon: Schema.NullOr(Schema.String),
  kategorije: Schema.Array(Schema.Number),
})

export type KreirajVozacCmd = typeof KreirajVozacCmd.Type

export const ioVozacOrder = Schema.Literal('prezime', 'ime', 'imeZaPrikaz', 'email', 'telefon', 'stanje')

export type VozacOrder = typeof ioVozacOrder.Type

export type VozacCriteria = {
  readonly ime?: StringPredicate
  readonly prezime?: StringPredicate
  readonly imeZaPrikaz?: StringPredicate
  readonly email?: StringPredicate
  readonly telefon?: StringPredicate
  readonly kategorijaID?: number
  readonly stanje?: EnumPredicate<StanjeVozaca.Value>
}
