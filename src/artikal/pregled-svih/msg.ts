import type * as List from '../../common/pretraga'
import type { ArtikalPakovanjeOrder, ArtikalPakovanjeResult } from '../api'

// -------------------------------------------------------------------------------------
// Паковања артикла — угнежђена листа
// -------------------------------------------------------------------------------------
//
// Порука је обична порука листе. Угнежђена листа нема свој URL — стање јој не иде у
// адресну линију, јер адресна линија већ описује артикал изнад ње. Зато овде нема ни
// исхода `StanjePromenjeno` да се обрађује.

export type Red = ArtikalPakovanjeResult
export type Kolona = ArtikalPakovanjeOrder

export type Msg = List.Msg<Red, Kolona>
