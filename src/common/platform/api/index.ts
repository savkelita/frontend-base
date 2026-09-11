import * as S from 'effect/Schema'
import * as Http from 'tea-effect/Http'
import type { ComboSource, SelectOption } from '../../forms'
import type { AnyCriteria, ComboItem, PretragaRequest, PretragaResponse } from '../contract'
import { sNoContent, upisiKriterijume } from '../contract'
import { ocekujJson, saXsrf } from '../http'
import type { BackendProfile } from '../profile'
import { apiUrl } from '../../../config'
import type * as Ruta from './ruta'

// -------------------------------------------------------------------------------------
// makeApi — руте постају декларације
// -------------------------------------------------------------------------------------
//
// Модул именује свој backend једном, при прављењу `api`-ја. Прелазак модула са једног тима
// на други је измена једне линије; ниједан екран изнад не зна ко га услужује.
//
//   const api = makeApi(profiles.java, '/api/otpremnica')
//   export const pretraziStavke = api.pretraga(
//     'pretraziStavkaOtpremnice', sStavkaResult, sStavkaCriteria, sStavkaOrder)
//
// Свака рута прима шеме, не типове: из њих се изводе и тип и провера, па нигде нема
// анотације која уме да се разиђе са стварношћу. Исто што затечени пројекти раде кад
// предају `ioArtikalCriteria` градитељу упита.
//
// `base` је путања како стоји на backend-у. Префикс инстанце додаје `apiUrl()`, и то при
// састављању захтева а не при увозу модула — да конфигурација стигне пре прве руте.

/** Подразумевана лабела: `sifra - naziv`, или само `naziv` кад шифре нема. */
const podrazumevanaOpcija = (item: ComboItem): SelectOption => ({
  value: String(item.id),
  label: item.sifra ? `${item.sifra} - ${item.naziv}` : item.naziv,
})

/** Колико редова combo довлачи по страни. */
const COMBO_LIMIT = 10

export type ComboOpcije<A> = {
  /** Мапирање реда у опцију; изостаје за стандардни `{ id, sifra?, naziv }` облик. */
  readonly toOption?: (item: A) => SelectOption
  /** Које поље носи откуцани текст. Java га игнорише, .NET му шаље вредност. */
  readonly tekstPolje?: string
  readonly limit?: number
}

/**
 * Само оно што рута признаје иде до сервера. Критеријуми долазе из адресне линије, коју
 * корисник сме да откуца руком; непознат кључ би иначе отишао backend-у на тумачење.
 */
const samoPoznata = (criteria: AnyCriteria, polja: ReadonlyArray<string>): AnyCriteria => {
  const preostalo: Record<string, AnyCriteria[string]> = {}
  for (const polje of polja) if (criteria[polje] !== undefined) preostalo[polje] = criteria[polje]
  return preostalo
}

export const makeApi = (profile: BackendProfile, base: string) => {
  const opseg = (useCase: string | null) => {
    const putanja = (operacija: string) => profile.url(apiUrl() + base, useCase, operacija)

    // Претрага без шема критеријума и колона — combo је једини корисник: његови критеријуми
    // долазе из профила (`unetaVrednost` или именовано поље), не из декларације руте.
    const pretragaSirovo =
      <A, I>(operacija: string, result: S.Schema<A, I>) =>
      (request: PretragaRequest<AnyCriteria, string>): Http.Request<PretragaResponse<A>> =>
        saXsrf(Http.get(`${putanja(operacija)}?${profile.query(request)}`, ocekujJson(profile.pretraga(result))))

    const pretraga = <A, I, F extends S.Struct.Fields, O extends string, OI>(
      operacija: string,
      result: S.Schema<A, I>,
      criteria: S.Struct<F>,
      order: S.Schema<O, OI> & { readonly literals: ReadonlyArray<O> },
    ): Ruta.Pretraga<S.Struct.Type<F>, O, A> => {
      const polja = Object.keys(criteria.fields)
      const posalji = (request: PretragaRequest<S.Struct.Type<F>, O>): Http.Request<PretragaResponse<A>> => {
        // Једино сужавање у целом путу: тип критеријума руте се изводи из шеме, а профил
        // барата обичним вредностима. Ништа се не губи — испод стоји исти објекат.
        const zaProfil: PretragaRequest<AnyCriteria, O> = {
          ...request,
          criteria: samoPoznata(request.criteria as AnyCriteria, polja),
        }
        return saXsrf(
          Http.get(`${putanja(operacija)}?${profile.query(zaProfil)}`, ocekujJson(profile.pretraga(result))),
        )
      }
      return Object.assign(posalji, { kolone: order.literals, polja })
    }

    return {
      pretraga,

      /**
       * Један запис по идентификатору. Параметри иду у путању, редоследом којим стоје у
       * шеми — не редоследом којим су написани на месту позива.
       *
       *   api.dajInfo('dajArtikal', sDajArtikalParametri, sArtikalInfo)  ->  /dajArtikal/5
       */
      dajInfo:
        <PF extends S.Struct.Fields, A, I>(
          operacija: string,
          parametri: S.Struct<PF>,
          result: S.Schema<A, I>,
        ): Ruta.Info<S.Struct.Type<PF>, A> =>
        vrednosti => {
          const kljucevi = Object.keys(parametri.fields)
          const segmenti = kljucevi.map(k => encodeURIComponent(String((vrednosti as Record<string, unknown>)[k])))
          return saXsrf(Http.get([putanja(operacija), ...segmenti].join('/'), ocekujJson(result)))
        },

      /** GET са произвољним параметрима — операција која није ни претрага ни dajInfo. */
      upit:
        <A, I>(operacija: string, result: S.Schema<A, I>) =>
        (parametri: AnyCriteria): Http.Request<A> => {
          const params = new URLSearchParams()
          upisiKriterijume(params, parametri)
          return saXsrf(Http.get(`${putanja(operacija)}?${params.toString()}`, ocekujJson(result)))
        },

      /** POST без тела — продужавање сесије, одјава. */
      pozovi:
        <B, BI>(operacija: string, result: S.Schema<B, BI>) =>
        (): Http.Request<B> =>
          saXsrf(Http.post(putanja(operacija), Http.emptyBody, ocekujJson(result))),

      /**
       * Команда: POST са телом. Трећи аргумент је оно што сервер враћа — креирање враћа
       * идентитет насталог објекта, измена и брисање не враћају ништа.
       *
       *   api.komanda('azurirajArtikal', sAzurirajArtikalCmd)
       *   api.komanda('kreirajArtikal', sKreirajArtikalCmd, sObjekatIdentifikator)
       */
      // Две гране (са одговором и без) не могу да поделе један потпис који TypeScript уме
      // да провери, па потписи стоје испод као преоптерећења, а тело кроз `any`. Позиви су
      // проверени; непроверено остаје само ово једно место.
      komanda: (<A, I>(operacija: string, cmd: S.Schema<A, I>, result?: S.Schema<any, any>) =>
        (telo: A): Http.Request<any> =>
          saXsrf(
            Http.post(
              putanja(operacija),
              Http.jsonBody(cmd, telo),
              result === undefined ? ocekujJson(sNoContent) : ocekujJson(result),
            ),
          )) as {
        <A, I>(operacija: string, cmd: S.Schema<A, I>): Ruta.Komanda<A>
        <A, I, B, BI>(operacija: string, cmd: S.Schema<A, I>, result: S.Schema<B, BI>): Ruta.Komanda<A, B>
      },

      /**
       * Извор за combo. Текст који корисник куца уписује профил, па исти позив ради и
       * према Java и према .NET рути; шема критеријума каже по чему combo још сме да тражи
       * — обично по родитељу у каскади.
       */
      combo: <A, I, F extends S.Struct.Fields>(
        operacija: string,
        result: S.Schema<A, I>,
        criteria: S.Struct<F>,
        opcije: ComboOpcije<A> = {},
      ): ComboSource<A, S.Struct.Type<F>> => {
        const mapiraj = opcije.toOption ?? (podrazumevanaOpcija as (item: A) => SelectOption)
        const limit = opcije.limit ?? COMBO_LIMIT
        const tekstPolje = opcije.tekstPolje ?? 'naziv'
        const polja = Object.keys(criteria.fields)
        const trazi = pretragaSirovo(operacija, result)
        return {
          request: (extra, tekst, offset) =>
            trazi({
              limit,
              offset,
              criteria: { ...samoPoznata(extra as AnyCriteria, polja), ...profile.comboTekst(tekstPolje, tekst) },
            }),
          // Свака опција носи ред из ког је настала, да форма може да изведе вредност из
          // изабране опције без другог захтева.
          toOptions: (odgovor: PretragaResponse<A>) =>
            odgovor.podaci.map(red => ({ ...mapiraj(red), data: red }) as SelectOption<A>),
          total: (odgovor: PretragaResponse<A>) => odgovor.total,
        }
      },
    }
  }

  return { ...opseg(null), useCase: (ime: string) => opseg(ime) }
}

export type Api = ReturnType<typeof makeApi>
