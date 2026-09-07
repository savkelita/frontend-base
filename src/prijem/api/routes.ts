import * as Http from 'tea-effect/Http'
import { env } from '../../common/env'
import { MagacinArtikalPakovanjeInfo } from './types'
import type { MagacinArtikalPakovanjeInfo as MagacinArtikalPakovanjeInfoType } from './types'

export const proveriMagacinArtikalPakovanje = (
  magacinID: number,
  artikalPakovanjeID: number,
): Http.Request<MagacinArtikalPakovanjeInfoType> =>
  Http.get(
    `${env.apiBaseUrl}/api/sifarnik/proveriMagacinArtikalPakovanje?magacinID=${magacinID}&artikalPakovanjeID=${artikalPakovanjeID}`,
    Http.expectJson(MagacinArtikalPakovanjeInfo),
  )
