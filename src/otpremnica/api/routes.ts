import * as S from 'effect/Schema'
import * as Http from 'tea-effect/Http'
import { ObjekatIdentifikator } from '../../common/api'
import type { ObjekatIdentifikator as ObjekatIdentifikatorType } from '../../common/api'
import { env } from '../../common/env'
import * as Pretraga from '../../common/pretraga'
import type { PretragaResponse } from '../../common/pretraga'
import {
  ArtikalPakovanjeOtpremnicaComboResult,
  StavkaPorudzbeniceOtpremnicaComboResult,
  KreirajStavkaOtpremniceCmd,
} from './types'
import type {
  ArtikalPakovanjeOtpremnicaComboResult as ArtikalPakovanjeOtpremnicaComboResultType,
  ArtikalPakovanjeOtpremnicaComboCriteria,
  StavkaPorudzbeniceOtpremnicaComboResult as StavkaPorudzbeniceOtpremnicaComboResultType,
  StavkaPorudzbeniceOtpremnicaComboCriteria,
  KreirajStavkaOtpremniceCmd as KreirajStavkaOtpremniceCmdType,
} from './types'

const base = `${env.apiBaseUrl}/api/otpremnica`

// -------------------------------------------------------------------------------------
// Rute comboa
// -------------------------------------------------------------------------------------

export const pretraziArtikalPakovanjeOtpremnicaCombo = (
  criteria: ArtikalPakovanjeOtpremnicaComboCriteria,
  offset = 0,
  limit?: number,
): Http.Request<PretragaResponse<ArtikalPakovanjeOtpremnicaComboResultType>> =>
  Pretraga.comboRequest(
    `${base}/pretraziArtikalPakovanjeOtpremnicaCombo`,
    ArtikalPakovanjeOtpremnicaComboResult,
    criteria,
    { offset, limit },
  )

export const pretraziStavkaPorudzbeniceOtpremnicaCombo = (
  criteria: StavkaPorudzbeniceOtpremnicaComboCriteria,
  offset = 0,
  limit?: number,
): Http.Request<PretragaResponse<StavkaPorudzbeniceOtpremnicaComboResultType>> =>
  Pretraga.comboRequest(
    `${base}/pretraziStavkaPorudzbeniceOtpremnicaCombo`,
    StavkaPorudzbeniceOtpremnicaComboResult,
    criteria,
    { offset, limit },
  )

// -------------------------------------------------------------------------------------
// Stavka otpremnice
// -------------------------------------------------------------------------------------

/** Redni broj predložen za novu stavku; odgovor je goli broj. */
export const dajSledeciRedniBrojStavkeOtpremnice = (otpremnicaID: number): Http.Request<number> =>
  Http.get(`${base}/dajSledeciRedniBrojStavkeOtpremnice/${otpremnicaID}`, Http.expectJson(S.Number))

export const kreirajStavkaOtpremnice = (cmd: KreirajStavkaOtpremniceCmdType): Http.Request<ObjekatIdentifikatorType> =>
  Http.post(
    `${base}/kreirajStavkaOtpremnice`,
    Http.jsonBody(KreirajStavkaOtpremniceCmd, cmd),
    Http.expectJson(ObjekatIdentifikator),
  )
