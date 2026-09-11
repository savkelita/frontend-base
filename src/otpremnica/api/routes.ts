import * as S from 'effect/Schema'
import { makeApi, profiles, sObjekatIdentifikator } from '../../common/platform'
import {
  sArtikalPakovanjeOtpremnicaComboCriteria,
  sArtikalPakovanjeOtpremnicaComboResult,
  sArtikalPakovanjeOtpremnicaOrder,
  sKreirajStavkaOtpremniceCmd,
  sStavkaOtpremniceCriteria,
  sStavkaOtpremniceOrder,
  sStavkaOtpremniceResult,
  sStavkaPorudzbeniceOtpremnicaComboCriteria,
  sStavkaPorudzbeniceOtpremnicaComboResult,
} from './types'

// -------------------------------------------------------------------------------------
// Отпремница — Java модул
// -------------------------------------------------------------------------------------

const api = makeApi(profiles.java, '/api/otpremnica')

// --- combo извори ---
//
// Ниједан од ова два реда не носи стандардни пар `sifra` / `naziv`, па се лабела задаје.

export const ArtikalPakovanjeOtpremnicaCombo = api.combo(
  'pretraziArtikalPakovanjeOtpremnicaCombo',
  sArtikalPakovanjeOtpremnicaComboResult,
  sArtikalPakovanjeOtpremnicaComboCriteria,
  { toOption: item => ({ value: String(item.id), label: item.pakovanjeDimenzijaNaziv }) },
)

export const StavkaPorudzbeniceOtpremnicaCombo = api.combo(
  'pretraziStavkaPorudzbeniceOtpremnicaCombo',
  sStavkaPorudzbeniceOtpremnicaComboResult,
  sStavkaPorudzbeniceOtpremnicaComboCriteria,
  {
    toOption: item => ({
      value: String(item.id),
      label: `${item.redniBroj} - ${item.artikalSifra} - ${item.artikalNaziv}`,
    }),
  },
)

// --- операције ---

/** Претрага паковања, за дохватање реда иза изабране ставке поруџбенице. */
export const pretraziArtikalPakovanjeOtpremnicaCombo = api.pretraga(
  'pretraziArtikalPakovanjeOtpremnicaCombo',
  sArtikalPakovanjeOtpremnicaComboResult,
  sArtikalPakovanjeOtpremnicaComboCriteria,
  sArtikalPakovanjeOtpremnicaOrder,
)

export const pretraziStavkaOtpremnice = api.pretraga(
  'pretraziStavkaOtpremnice',
  sStavkaOtpremniceResult,
  sStavkaOtpremniceCriteria,
  sStavkaOtpremniceOrder,
)

/** Редни број предложен за нову ставку; одговор је голи број. */
export const dajSledeciRedniBrojStavkeOtpremnice = api.dajInfo(
  'dajSledeciRedniBrojStavkeOtpremnice',
  S.Struct({ otpremnicaID: S.Number }),
  S.Number,
)

export const kreirajStavkaOtpremnice = api.komanda(
  'kreirajStavkaOtpremnice',
  sKreirajStavkaOtpremniceCmd,
  sObjekatIdentifikator,
)
