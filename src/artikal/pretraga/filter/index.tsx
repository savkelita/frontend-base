import * as Filter from '../../../common/filter'
import { OPERATORI_TEKST, Polje } from '../../../common/filter'
import { profiles } from '../../../common/platform'
import { S } from '../../../common/strings'
import { ArtikalStanje } from '../../domain/artikal-stanje'

// -------------------------------------------------------------------------------------
// Филтер артикала
// -------------------------------------------------------------------------------------
//
// Исто место као `pretraga/filter` у затеченим пројектима. Имена поља су имена критеријума
// које рута већ прима, па се нацрт филтера претвара у критеријуме без иједног мапирања.
//
// Профил се предаје `napraviFilter`-у: предикатска поља (`[оператор, вредност]`) постоје
// само на Java страни, па прелазак овог модула на .NET овде пуца одмах, при дизању.

export const polja = {
  sifra: Polje.tekstPredikat({
    label: S.artikal.sifra,
    operatori: OPERATORI_TEKST,
    podrazumevani: 'contains',
  }),
  naziv: Polje.tekstPredikat({
    label: S.artikal.naziv,
    operatori: OPERATORI_TEKST,
    podrazumevani: 'contains',
  }),
  stanje: Polje.izbor({ label: S.artikal.stanje, options: ArtikalStanje.opcije }),
}

export type Polja = typeof polja

export const filter = Filter.napraviFilter(profiles.java, polja, field => (
  <>
    {field('sifra')}
    {field('naziv')}
    {field('stanje')}
  </>
))
