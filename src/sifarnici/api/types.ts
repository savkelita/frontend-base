import { Schema } from 'effect'
import { Audit } from '../../common/audit'
import type { Criteria as ComboCriteria } from '../../common/domain/combo'
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

export const MarkaVozilaCombo = Schema.Struct({
  marka: Schema.String,
})

export type MarkaVozilaCombo = typeof MarkaVozilaCombo.Type

export const ModelVozilaCombo = Schema.Struct({
  model: Schema.String,
})

export type ModelVozilaCombo = typeof ModelVozilaCombo.Type

export type ModelVozilaComboCriteria = ComboCriteria & {
  readonly marka: StringPredicate
}

export const VrstaGorivaCombo = Schema.Struct({
  id: Schema.Number,
  naziv: Schema.String,
})

export type VrstaGorivaCombo = typeof VrstaGorivaCombo.Type

export const VrstaVozilaCombo = Schema.Struct({
  id: Schema.Number,
  naziv: Schema.String,
})

export type VrstaVozilaCombo = typeof VrstaVozilaCombo.Type

export const KorisnikVozilaCombo = Schema.Struct({
  id: Schema.Number,
  naziv: Schema.String,
})

export type KorisnikVozilaCombo = typeof KorisnikVozilaCombo.Type

export const VozacCombo = Schema.Struct({
  id: Schema.Number,
  ime: Schema.String,
  prezime: Schema.String,
  imeZaPrikaz: Schema.String,
})

export type VozacCombo = typeof VozacCombo.Type

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
  audit: Audit,
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
