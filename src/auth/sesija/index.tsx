import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import * as Sub from 'tea-effect/Sub'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Form } from '../../common/forms'
import { S, popuni, t } from '../../common/strings'
import * as Api from '../api'
import { SESIJA_KLJUC, izOdgovora, preostaloSekundi } from '../session'
import type { Sesija } from '../session'
import { Ishod, Msg, izDrugeKartice, odjava, otkucaj, produzavanjeNijeUspelo, produzena, produzi } from './msg'

export type { Msg }
export { Ishod }

// -------------------------------------------------------------------------------------
// Сесија — одбројавање, продужавање и синхронизација картица
// -------------------------------------------------------------------------------------
//
// Колачић истиче на серверу, па апликација броји до истека и на време пита корисника.
// Одбројавање је обичан `Sub` откуцај, а обавештавање између картица `storage` догађај —
// без rxjs-a, који је затеченим пројектима за то био потребан.

/** Колико пре истека се пита за продужавање. */
const UPOZORENJE_SEKUNDI = 120

export type Model = {
  readonly sesija: Sesija
  readonly preostalo: number
  /** Продужавање је у лету — дугме се закључава да се не пошаље двапут. */
  readonly produzavanje: boolean
}

export const init = (sesija: Sesija, sada: number = Date.now()): Model => ({
  sesija,
  preostalo: preostaloSekundi(sesija, sada),
  produzavanje: false,
})

/** Дијалог се показује тек кад преостане мање од прага. */
export const upozorava = (model: Model): boolean => model.preostalo <= UPOZORENJE_SEKUNDI

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>, Ishod] =>
  Msg.$match(msg, {
    Otkucaj: ({ sada }): [Model, Cmd.Cmd<Msg>, Ishod] => {
      const preostalo = preostaloSekundi(model.sesija, sada)
      // Нула значи да је колачић на серверу већ мртав — нема шта да се продужава.
      return preostalo === 0
        ? [{ ...model, preostalo }, Cmd.none, Ishod.Zavrsena()]
        : [{ ...model, preostalo }, Cmd.none, Ishod.Nastavi()]
    },

    Produzi: (): [Model, Cmd.Cmd<Msg>, Ishod] =>
      model.produzavanje
        ? [model, Cmd.none, Ishod.Nastavi()]
        : [
            { ...model, produzavanje: true },
            Http.send(Api.produziSesiju(), { onSuccess: produzena, onError: produzavanjeNijeUspelo }),
            Ishod.Nastavi(),
          ],

    Produzena: ({ odgovor }): [Model, Cmd.Cmd<Msg>, Ishod] => {
      const sesija = izOdgovora(odgovor)
      return [{ ...init(sesija), produzavanje: false }, Cmd.none, Ishod.Obnovljena({ sesija })]
    },

    // Ако продужавање не прође, сесија више не важи — нема смисла остављати корисника у
    // апликацији која ће му на сваки следећи захтев вратити 401.
    ProduzavanjeNijeUspelo: (): [Model, Cmd.Cmd<Msg>, Ishod] => [
      { ...model, produzavanje: false },
      Cmd.none,
      Ishod.Zavrsena(),
    ],

    Odjava: (): [Model, Cmd.Cmd<Msg>, Ishod] => [model, Cmd.none, Ishod.Zavrsena()],

    IzDrugeKartice: ({ sesija }): [Model, Cmd.Cmd<Msg>, Ishod] =>
      sesija === null ? [model, Cmd.none, Ishod.Zavrsena()] : [init(sesija), Cmd.none, Ishod.Obnovljena({ sesija })],
  })

// -------------------------------------------------------------------------------------
// Претплате
// -------------------------------------------------------------------------------------

const procitajIzSkladista = (): Sesija | null => {
  const zapis = window.localStorage.getItem(SESIJA_KLJUC)
  if (zapis === null) return null
  try {
    const podaci = JSON.parse(zapis) as Sesija
    return typeof podaci?.korisnickoIme === 'string' ? podaci : null
  } catch {
    return null
  }
}

/** `storage` се пали само у ОСТАЛИМ картицама — тачно оно што нам треba. */
const izmeneUDrugimKarticama: Sub.Sub<Msg> = Sub.fromCallback(emit => {
  const slusalac = (e: StorageEvent) => {
    if (e.key !== SESIJA_KLJUC && e.key !== null) return
    emit(izDrugeKartice(procitajIzSkladista()))
  }
  window.addEventListener('storage', slusalac)
  return () => window.removeEventListener('storage', slusalac)
}, 'sesija-storage')

// `Sub.interval` носи готову поруку, па би време било замрзнуто на тренутак учитавања.
// Овако сваки откуцај носи свој тренутак, а `update` остаје чист.
const otkucajSvakeSekunde: Sub.Sub<Msg> = Sub.fromCallback(emit => {
  const id = setInterval(() => emit(otkucaj(Date.now())), 1000)
  return () => clearInterval(id)
}, 'sesija-otkucaj')

export const subscriptions: Sub.Sub<Msg> = Sub.batch([otkucajSvakeSekunde, izmeneUDrugimKarticama])

// -------------------------------------------------------------------------------------
// Приказ
// -------------------------------------------------------------------------------------

const kaoVreme = (sekundi: number): string => {
  const m = Math.floor(sekundi / 60)
  const s = sekundi % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    upozorava(model)
      ? Form.confirmDialog({
          title: t(S.sesija.naslov),
          message: t(popuni(S.sesija.poruka, { vreme: kaoVreme(model.preostalo) })),
          confirmLabel: t(S.sesija.produzi),
          onConfirm: () => dispatch(produzi()),
          onCancel: () => dispatch(odjava()),
          busy: model.produzavanje,
        })
      : null

export type { Sesija }
