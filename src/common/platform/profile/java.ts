import * as S from 'effect/Schema'
import type { AnyCriteria, PretragaRequest, PretragaResponse } from '../contract'
import { sPretragaResponse, upisiKriterijume } from '../contract'
import type { BackendProfile } from './index'

// -------------------------------------------------------------------------------------
// Java / Spring — ручно писан backend
// -------------------------------------------------------------------------------------
//
//   путања    /api/{модул}/{операција}
//   упит      limit_ / offset_ / order_=колона&order_=ASC
//   одговор   { total_, offset_, result }
//   combo     unetaVrednost=contains&unetaVrednost=<текст>

const query = (request: PretragaRequest): string => {
  const params = new URLSearchParams()
  if (request.limit != null) params.set('limit_', String(request.limit))
  if (request.offset != null) params.set('offset_', String(request.offset))
  upisiKriterijume(params, request.criteria)
  // Нема граничника — редослед параметара носи значење: колона, смер, колона, смер…
  for (const [kolona, smer] of request.sort ?? []) {
    params.append('order_', kolona)
    params.append('order_', smer)
  }
  return params.toString()
}

const pretraga = <A, I>(result: S.Schema<A, I>): S.Schema<PretragaResponse<A>, any> =>
  S.transform(
    S.Struct({ total_: S.Number, offset_: S.NullOr(S.Number), result: S.Array(result) }),
    sPretragaResponse(result),
    {
      strict: true,
      decode: r => ({ total: r.total_, offset: r.offset_, podaci: r.result }),
      encode: n => ({ total_: n.total, offset_: n.offset, result: n.podaci }),
    },
  )

const comboTekst = (_polje: string, tekst: string): AnyCriteria => ({ unetaVrednost: ['contains', tekst] })

export const java: BackendProfile = {
  id: 'java',
  url: (base, _useCase, operacija) => `${base}/${operacija}`,
  query,
  pretraga,
  comboTekst,
}
