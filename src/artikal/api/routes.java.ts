import { makeApi, profiles, sObjekatIdentifikator } from '../../common/platform'
import {
  sArtikalCriteria,
  sArtikalInfo,
  sArtikalOrder,
  sArtikalPakovanjeCriteria,
  sArtikalPakovanjeOrder,
  sArtikalPakovanjeResult,
  sArtikalResult,
  sAzurirajArtikalCmd,
  sDajArtikalParametri,
  sGrupaArtiklaComboCriteria,
  sGrupaArtiklaComboResult,
  sJedinicaMereComboCriteria,
  sJedinicaMereComboResult,
  sKreirajArtikalCmd,
} from './types'

// -------------------------------------------------------------------------------------
// Артикал — Java рута
// -------------------------------------------------------------------------------------
//
// Овај фајл и `routes.dotnet.ts` разликују се у **једној линији**: имену профила и базној
// путањи. Све остало — имена операција, шеме, редослед — стоји дословно исто. То је и
// сврха пилота: ако се шав негде пробије, пробиће се овде, док кошта један модул.
//
// Свака рута прима шеме, не типове. Из њих се изводи и оно што рута враћа и оно што сме да
// прими, па се `sort: [['bilo_sta', 'ASC']]` не преводи.

const api = makeApi(profiles.java, '/api/sifarnik')

export const pretraziArtikal = api.pretraga('pretraziArtikal', sArtikalResult, sArtikalCriteria, sArtikalOrder)

export const dajArtikal = api.dajInfo('dajArtikal', sDajArtikalParametri, sArtikalInfo)

export const kreirajArtikal = api.komanda('kreirajArtikal', sKreirajArtikalCmd, sObjekatIdentifikator)

export const azurirajArtikal = api.komanda('azurirajArtikal', sAzurirajArtikalCmd)

export const obrisiArtikal = api.komanda('obrisiArtikal', sObjekatIdentifikator)

export const pretraziArtikalPakovanje = api.pretraga(
  'pretraziArtikalPakovanje',
  sArtikalPakovanjeResult,
  sArtikalPakovanjeCriteria,
  sArtikalPakovanjeOrder,
)

export const pretraziJedinicaMereCombo = api.combo(
  'pretraziJedinicaMereCombo',
  sJedinicaMereComboResult,
  sJedinicaMereComboCriteria,
)

export const pretraziGrupaArtiklaCombo = api.combo(
  'pretraziGrupaArtiklaCombo',
  sGrupaArtiklaComboResult,
  sGrupaArtiklaComboCriteria,
)
