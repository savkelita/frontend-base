import * as Http from 'tea-effect/Http'
import { env } from '../../common/env'
import * as Pretraga from '../../common/pretraga'
import type { PretragaResponse } from '../../common/pretraga'
import { ArtikalComboResult } from './types'
import type { ArtikalComboResult as ArtikalComboResultType, ArtikalComboCriteria } from './types'

export const pretraziArtikalCombo = (
  criteria: ArtikalComboCriteria,
  offset = 0,
  limit?: number,
): Http.Request<PretragaResponse<ArtikalComboResultType>> =>
  Pretraga.comboRequest(`${env.apiBaseUrl}/api/sifarnik/pretraziArtikalCombo`, ArtikalComboResult, criteria, {
    offset,
    limit,
  })
