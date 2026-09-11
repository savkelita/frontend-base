import { Data } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { SesijaOdgovor } from '../api'
import type { Sesija } from '../session'

export type Msg = Data.TaggedEnum<{
  /** Откуцај секунде док је корисник пријављен. */
  Otkucaj: { readonly sada: number }
  Produzi: {}
  Produzena: { readonly odgovor: SesijaOdgovor }
  ProduzavanjeNijeUspelo: { readonly error: Http.HttpError }
  /** Корисник је одустао од продужавања, или је сесија истекла. */
  Odjava: {}
  /** Друга картица се пријавила или одјавила. */
  IzDrugeKartice: { readonly sesija: Sesija | null }
}>

export const Msg = Data.taggedEnum<Msg>()

export const otkucaj = (sada: number): Msg => Msg.Otkucaj({ sada })
export const produzi = (): Msg => Msg.Produzi()
export const produzena = (odgovor: SesijaOdgovor): Msg => Msg.Produzena({ odgovor })
export const produzavanjeNijeUspelo = (error: Http.HttpError): Msg => Msg.ProduzavanjeNijeUspelo({ error })
export const odjava = (): Msg => Msg.Odjava()
export const izDrugeKartice = (sesija: Sesija | null): Msg => Msg.IzDrugeKartice({ sesija })

/**
 * Шта домаћин мора да уради. Сесија сама не зна да преусмери на пријаву — то је ствар
 * рутера.
 */
export type Ishod = Data.TaggedEnum<{
  Nastavi: {}
  /** Сесија је обновљена — треба је уписати и у кеш. */
  Obnovljena: { readonly sesija: Sesija }
  /** Готово: одјава, истек, или одјава у другој картици. */
  Zavrsena: {}
}>

export const Ishod = Data.taggedEnum<Ishod>()
