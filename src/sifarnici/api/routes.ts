import { makeApi, profiles } from '../../common/platform'
import { sArtikalComboCriteria, sArtikalComboResult } from './types'

// -------------------------------------------------------------------------------------
// Шифарник — Java модул
// -------------------------------------------------------------------------------------
//
// Backend се именује једном, овде. Испод ове линије ниједан екран не зна ко га услужује.

const api = makeApi(profiles.java, '/api/sifarnik')

/** Артикал нема стандардни `naziv` пар за лабелу, па се она задаје изричито. */
export const ArtikalCombo = api.combo('pretraziArtikalCombo', sArtikalComboResult, sArtikalComboCriteria, {
  toOption: item => ({ value: String(item.id), label: `${item.sifra} - ${item.naziv}` }),
})
