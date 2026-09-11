import * as S from 'effect/Schema'

// -------------------------------------------------------------------------------------
// Неутрални уговор према backend-у
// -------------------------------------------------------------------------------------
//
// Ово је оно што види остатак апликације: ниједно име са жице. Java и .NET облици живе у
// профилима (`../profile`), а између стоји овај тип. Екран не зна ко га услужује.
//
// Именовање: шема носи префикс `s`, тип стоји го — `sObjekatIdentifikator` је вредност,
// `ObjekatIdentifikator` је тип. Исти распоред који затечени пројекти имају са `io`
// префиксом (`ioObjekatIdentifikator`), само друго слово.

/** Вредност критеријума: скалар, или н-торка која се на жици понавља под истим кључем. */
export type Predicate = string | number | readonly (string | number)[]

export type AnyCriteria = Record<string, Predicate | undefined>

// -------------------------------------------------------------------------------------
// Предикати
// -------------------------------------------------------------------------------------
//
// Вокабулар оператора долази са Java стране, па стоји овде уз остатак уговора — а не у
// филтеру, који над њим само додаје српске ознаке. Тако шема критеријума може да каже који
// су оператори дозвољени, без да `api` увози `filter`.
//
// На жици предикат постаје поновљен кључ: `sifra=contains&sifra=ART`.

export const sOperatorTekst = S.Literal('contains', 'eq', 'neq', 'starts_with')
export type OperatorTekst = typeof sOperatorTekst.Type

export const sOperatorBroj = S.Literal('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between')
export type OperatorBroj = typeof sOperatorBroj.Type

export const sOperatorDatum = S.Literal('eq', 'before', 'after', 'before_or_same', 'after_or_same', 'between')
export type OperatorDatum = typeof sOperatorDatum.Type

/** Оператор и вредност. Код `between` су обе границе у вредности, спојене тилдом. */
export const sTekstPredikat = S.Tuple(sOperatorTekst, S.String)
export type TekstPredikat = typeof sTekstPredikat.Type

export const sBrojPredikat = S.Tuple(sOperatorBroj, S.String)
export type BrojPredikat = typeof sBrojPredikat.Type

export const sDatumPredikat = S.Tuple(sOperatorDatum, S.String)
export type DatumPredikat = typeof sDatumPredikat.Type

export type SortDirection = 'ASC' | 'DESC'

/**
 * Једна колона сортирања. Више колона постоји само као почетна вредност — први клик на
 * заглавље своди сорт на једну колону.
 */
export type Sort<Order extends string = string> = readonly [Order, SortDirection]

/**
 * `Criteria` намерно није ограничен на `AnyCriteria`: критеријуми руте се изводе из њене
 * шеме, а TypeScript за неразрешен генерик не уме да докаже да мапирани тип задовољава тип
 * са индексним потписом. Ограничење би значило да ниједна рута не може да именује своје
 * критеријуме. Сужавање се дешава на једном месту — при предаји профилу.
 */
export type PretragaRequest<Criteria = AnyCriteria, Order extends string = string> = {
  readonly limit?: number
  readonly offset?: number
  readonly criteria: Criteria
  readonly sort?: ReadonlyArray<Sort<Order>>
}

export type PretragaResponse<Result> = {
  readonly total: number
  readonly offset: number | null
  readonly podaci: ReadonlyArray<Result>
}

/** Циљна шема за оба профила: у њу се преводи и Java и .NET облик одговора. */
export const sPretragaResponse = <A, I>(result: S.Schema<A, I>) =>
  S.Struct({ total: S.Number, offset: S.NullOr(S.Number), podaci: S.Array(S.typeSchema(result)) })

/**
 * Празно тело одговора. Backend на команду враћа `{}`, што овде постаје `void` — исто
 * као `noContentCodec` у затеченим пројектима.
 */
export const sNoContent = S.transform(S.Unknown, S.Void, {
  strict: true,
  decode: () => undefined,
  encode: () => ({}),
})

/** Идентитет објекта за измену и брисање: оптимистичко закључавање по id + version. */
export const sObjekatIdentifikator = S.Struct({ id: S.Number, version: S.Number })
export type ObjekatIdentifikator = typeof sObjekatIdentifikator.Type

/**
 * Критеријум који сваки combo има: `id`, за дохватање већ изабраног реда. Текст који
 * корисник куца не стоји овде — њега уписује профил, свако на свој начин.
 */
/**
 * Идентификатор у критеријуму. И број и текст стижу до истог query параметра, а из каскаде
 * долази нацрт родитеља — а он је текст. Зато оба облика важе.
 */
export const sIdKriterijum = S.Union(S.Number, S.String)

export const sBaseComboCriteria = S.Struct({ id: S.optional(sIdKriterijum) })
export type ComboCriteria = typeof sBaseComboCriteria.Type

/**
 * Combo који претражује и по нечему свом — најчешће по родитељу у каскади.
 *
 *   sComboCriteria({ artikalID: S.optional(S.Number) })
 */
export const sComboCriteria = <F extends S.Struct.Fields>(dodatna: F) =>
  S.Struct({ ...sBaseComboCriteria.fields, ...dodatna })

/** Стандардни облик реда за combo — из њега се лабела изводи сама. */
export type ComboItem = { readonly id: string | number; readonly sifra?: string | null; readonly naziv: string }

/**
 * Језгро combo одговора: `{ id, sifra, naziv }`. У затеченим пројектима та иста три поља
 * стоје преписана у десетинама шема; овде стоје једном. Combo који носи још нешто —
 * а такви су чести — прави се са `sComboResult`.
 */
export const sBaseComboResult = S.Struct({ id: S.Number, sifra: S.String, naziv: S.String })
export type BaseComboResult = typeof sBaseComboResult.Type

/**
 * Combo који уз та три поља носи и своја. Није наслеђивање него проширење, да додатна поља
 * остану видљива тамо где се combo и декларише.
 *
 *   const sLokacijaComboResult = sComboResult({ red: S.NullOr(S.Number), nivo: S.NullOr(S.Number) })
 */
export const sComboResult = <F extends S.Struct.Fields>(dodatna: F) =>
  S.Struct({ ...sBaseComboResult.fields, ...dodatna })

// -------------------------------------------------------------------------------------
// Кодирање упита — заједничко за оба профила
// -------------------------------------------------------------------------------------

/** Н-торка се на жици понавља под истим кључем; `undefined` испада. */
export const upisiKriterijume = (params: URLSearchParams, criteria: AnyCriteria): void => {
  for (const [kljuc, vrednost] of Object.entries(criteria)) {
    if (vrednost == null) continue
    if (Array.isArray(vrednost)) vrednost.forEach(v => params.append(kljuc, String(v)))
    else params.append(kljuc, String(vrednost))
  }
}
