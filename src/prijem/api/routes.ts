import { makeApi, profiles } from '../../common/platform'
import { sMagacinArtikalPakovanjeInfo } from './types'

// -------------------------------------------------------------------------------------
// Пријем — Java модул
// -------------------------------------------------------------------------------------

const api = makeApi(profiles.java, '/api/sifarnik')

const proveri = api.upit('proveriMagacinArtikalPakovanje', sMagacinArtikalPakovanjeInfo)

/** Да ли магацин већ познаје ово паковање артикла. Пита се пре снимања, не после. */
export const proveriMagacinArtikalPakovanje = (magacinID: number, artikalPakovanjeID: number) =>
  proveri({ magacinID, artikalPakovanjeID })
