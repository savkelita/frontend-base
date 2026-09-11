import * as S from 'effect/Schema'
import type { AnyCriteria, PretragaRequest, PretragaResponse } from '../contract'
import { sPretragaResponse, upisiKriterijume } from '../contract'
import type { BackendProfile } from './index'

// -------------------------------------------------------------------------------------
// .NET / iDEA — генерисан backend, уговор је улазни податак
// -------------------------------------------------------------------------------------
//
//   путања    /api/{app}/web/{area}/{useCase}/{операција}
//   упит      limit / offset / sort=колона asc,колона2 desc
//   одговор   { total, offset, limit, podaci }   — `limit` се не чита
//   combo     свако поље се именује посебно, вредност је гола

const query = (request: PretragaRequest): string => {
  const params = new URLSearchParams()
  if (request.limit != null) params.set('limit', String(request.limit))
  if (request.offset != null) params.set('offset', String(request.offset))
  upisiKriterijume(params, request.criteria)
  const sort = request.sort ?? []
  if (sort.length > 0) {
    // Један параметар, два нивоа дељења. URLSearchParams даје `+` за размак и `%2C` за зарез.
    params.set('sort', sort.map(([kolona, smer]) => `${kolona} ${smer.toLowerCase()}`).join(','))
  }
  return params.toString()
}

const pretraga = <A, I>(result: S.Schema<A, I>): S.Schema<PretragaResponse<A>, any> =>
  S.transform(
    // `limit` се не декларише — S.Struct вишак поља игнорише.
    S.Struct({ total: S.Number, offset: S.Number, podaci: S.Array(result) }),
    sPretragaResponse(result),
    {
      strict: true,
      decode: r => ({ total: r.total, offset: r.offset, podaci: r.podaci }),
      encode: n => ({ total: n.total, offset: n.offset ?? 0, podaci: n.podaci }),
    },
  )

const comboTekst = (polje: string, tekst: string): AnyCriteria => ({ [polje]: tekst })

export const dotnet: BackendProfile = {
  id: 'dotnet',
  url: (base, useCase, operacija) => (useCase === null ? `${base}/${operacija}` : `${base}/${useCase}/${operacija}`),
  query,
  pretraga,
  comboTekst,
}
