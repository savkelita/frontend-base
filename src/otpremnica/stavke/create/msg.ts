import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { ObjekatIdentifikator } from '../../../common/api'
import type { PretragaResponse } from '../../../common/pretraga'
import type { MagacinArtikalPakovanjeInfo } from '../../../prijem/api'
import type { ArtikalPakovanjeOtpremnicaComboResult } from '../../api'
import type { StavkaFormMsg } from './form'

export type Msg = Data.TaggedEnum<{
  Loaded: { readonly predlozeniRedniBroj: number }
  LoadFailed: { readonly error: Http.HttpError }
  Form: { readonly msg: StavkaFormMsg }
  /** Stavka porudžbenice je promenjena: artikal + pakovanje na koje pokazuje su pronađeni. */
  Prefilled: { readonly response: PretragaResponse<ArtikalPakovanjeOtpremnicaComboResult> }
  /** "Sačuvaj" pokreće preduslov, ne upis. */
  Provera: {}
  Checked: { readonly info: MagacinArtikalPakovanjeInfo }
  /** Odgovor na pitanje "magacin ne poznaje ovo pakovanje — kreirati ga?" */
  PotvrdiKreiranjeMagacinArtikalPakovanje: { readonly kreiraj: boolean }
  DismissConfirm: {}
  Saved: { readonly identifikator: ObjekatIdentifikator }
  /** Bilo koji od tri zahteva na putu snimanja je pao; forma se vraća korisniku. */
  Failed: { readonly error: Http.HttpError }
  Close: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const loaded = (predlozeniRedniBroj: number): Msg => Msg.Loaded({ predlozeniRedniBroj })
export const loadFailed = (error: Http.HttpError): Msg => Msg.LoadFailed({ error })
export const formMsg = (msg: StavkaFormMsg): Msg => Msg.Form({ msg })
export const prefilled = (response: PretragaResponse<ArtikalPakovanjeOtpremnicaComboResult>): Msg =>
  Msg.Prefilled({ response })
export const provera = (): Msg => Msg.Provera()
export const checked = (info: MagacinArtikalPakovanjeInfo): Msg => Msg.Checked({ info })
export const potvrdiKreiranjeMagacinArtikalPakovanje = (kreiraj: boolean): Msg =>
  Msg.PotvrdiKreiranjeMagacinArtikalPakovanje({ kreiraj })
export const dismissConfirm = (): Msg => Msg.DismissConfirm()
export const saved = (identifikator: ObjekatIdentifikator): Msg => Msg.Saved({ identifikator })
export const failed = (error: Http.HttpError): Msg => Msg.Failed({ error })
export const close = (): Msg => Msg.Close()

// -------------------------------------------------------------------------------------
// Outcome — ono na šta host mora da reaguje. Nosi identitet kreirane stavke, pa host može da
// je prikaže bez ponovnog čitanja liste.
// -------------------------------------------------------------------------------------

export type Outcome = Data.TaggedEnum<{
  Active: {}
  Success: { readonly identifikator: ObjekatIdentifikator }
  Cancel: {}
}>

export const Outcome = Data.taggedEnum<Outcome>()
