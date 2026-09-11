import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ArtikalInfo } from '../api'
import type * as Azuriranje from '../azuriranje'
import type * as Brisanje from '../brisanje'
import type * as Pakovanja from '../pregled-svih'

// Свака радња има свој пар: „покрени" (домаћин је отвара) и прослеђивање њених порука.
// Исти распоред као у затеченом стеку — по њему се одмах види шта екран уме.
export type Msg = Data.TaggedEnum<{
  Loaded: { readonly original: ArtikalInfo }
  Failed: { readonly error: Http.HttpError }
  StartAzuriranje: {}
  Azuriranje: { readonly msg: Azuriranje.Msg }
  StartBrisanje: {}
  Brisanje: { readonly msg: Brisanje.Msg }
  Pakovanja: { readonly msg: Pakovanja.Msg }
}>

export const Msg = Data.taggedEnum<Msg>()

export const loaded = (original: ArtikalInfo): Msg => Msg.Loaded({ original })
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const startAzuriranje = (): Msg => Msg.StartAzuriranje()
export const azuriranje = (msg: Azuriranje.Msg): Msg => Msg.Azuriranje({ msg })
export const startBrisanje = (): Msg => Msg.StartBrisanje()
export const brisanje = (msg: Brisanje.Msg): Msg => Msg.Brisanje({ msg })
export const pakovanja = (msg: Pakovanja.Msg): Msg => Msg.Pakovanja({ msg })
