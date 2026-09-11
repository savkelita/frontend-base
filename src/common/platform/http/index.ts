import type * as S from 'effect/Schema'
import * as Http from 'tea-effect/Http'

// -------------------------------------------------------------------------------------
// Транспорт — заједнички за оба профила
// -------------------------------------------------------------------------------------

/**
 * `Http.expectJson` тражи `Schema<A, A>`, али у позадини зове `Schema.decodeUnknown`, који
 * ради са било којим обликом. Профил враћа шему са трансформацијом (жичани облик у
 * неутрални), па је овде један прелаз типа — уместо истог таквог на сваком позиву.
 */
export const ocekujJson = <A, I>(schema: S.Schema<A, I>): Http.Expect<A> =>
  Http.expectJson(schema as unknown as S.Schema<A>)

// -------------------------------------------------------------------------------------
// XSRF
// -------------------------------------------------------------------------------------
//
// Сесија стоји у колачићу, па заглавље иде уз сваки захтев. Аутентикација није ствар
// профила — исти токен важи код оба backend-а, па је ово једна функција за обе фамилије.
//
// Колачића нема док корисник није пријављен, а .NET страна га данас ни не проверава.
// Зато: пошаљи ако постоји, прескочи ако не — непозната заглавља се игноришу.

const XSRF_KOLACIC = 'XSRF-TOKEN'
const XSRF_ZAGLAVLJE = 'X-XSRF-TOKEN'

export const procitajKolacic = (ime: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  for (const deo of document.cookie.split(';')) {
    const razmak = deo.indexOf('=')
    if (razmak === -1) continue
    if (deo.slice(0, razmak).trim() !== ime) continue
    return decodeURIComponent(deo.slice(razmak + 1))
  }
  return undefined
}

/** Качи XSRF заглавље кад колачић постоји. Примењује се на сваки захтев кроз makeApi. */
export const saXsrf = <A>(req: Http.Request<A>): Http.Request<A> => {
  const token = procitajKolacic(XSRF_KOLACIC)
  return token === undefined ? req : Http.withHeader(XSRF_ZAGLAVLJE, token)(req)
}
