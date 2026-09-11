import { Either, Schema as S } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Issue } from '../../forms'
import { S as Tekst, popuni, t } from '../../strings'
import { sGreske } from './tipovi'
import type { PoslovnaGreska, Greska, ErrorReport, Severity } from './tipovi'

export * from './tipovi'

// -------------------------------------------------------------------------------------
// Од HTTP грешке до поруке кориснику
// -------------------------------------------------------------------------------------

const dekodujGreske = S.decodeUnknownEither(sGreske)

/** Envelope из тела 400 одговора; празан низ кад тело није envelope. */
export const greskeIzTela = (telo: string): ReadonlyArray<Greska> => {
  try {
    return Either.getOrElse(dekodujGreske(JSON.parse(telo)), () => [])
  } catch {
    return []
  }
}

/** Само пословне грешке — једине које носе код и озбиљност. */
export const poslovneGreske = (error: Http.HttpError): ReadonlyArray<PoslovnaGreska> =>
  error._tag === 'BadStatus' && error.status === 400
    ? greskeIzTela(error.body).filter((g): g is PoslovnaGreska => g.type === 'BUSINESS')
    : []

// Упозорење је упозорење само ако су СВЕ грешке упозорења; једна права грешка обара скуп.
const ozbiljnostSkupa = (greske: ReadonlyArray<Greska>): Severity =>
  greske.length > 0 && greske.every(g => g.type === 'BUSINESS' && g.severity === 'WARNING') ? 'WARNING' : 'ERROR'

const report = (message: string, severity: Severity = 'ERROR'): ErrorReport => ({ message, severity })

const izStatusa = (status: number, telo: string): ErrorReport => {
  if (status === 400 || status === 401) {
    const greske = greskeIzTela(telo)
    if (greske.length === 0) return report(t(Tekst.greske.neocekivanaValidacija))
    return report(greske.map(g => g.message).join('\n'), ozbiljnostSkupa(greske))
  }
  if (status === 403) return report(t(Tekst.greske.nematePravo))
  if (status === 500) return report(t(Tekst.greske.naServeru))
  if (status === 503) return report(t(Tekst.greske.nedostupan))
  if (status === 504) return report(t(Tekst.greske.predugoObradjuje))
  return report(t(popuni(Tekst.greske.neocekivanStatus, { status })))
}

/** Свака HTTP грешка добија поруку коју корисник може да прочита. */
export const errorReport = (error: Http.HttpError): ErrorReport => {
  switch (error._tag) {
    case 'BadUrl':
      return report(t(Tekst.greske.nemaResursa))
    case 'Timeout':
      return report(t(Tekst.greske.istekloVreme))
    case 'NetworkError':
      return report(t(Tekst.greske.mreza))
    case 'BadBody':
    case 'BadRequestBody':
      return report(t(Tekst.greske.neocekivanOdgovor))
    case 'BadStatus':
      return izStatusa(error.status, error.body)
  }
}

/**
 * Envelope не носи име поља, само `code`. Пресликавање кода у поље зна модул, не платформа —
 * зато `poljePoKodu`. Грешке без познатог кода остају на нивоу форме (`path: []`), што и
 * даље блокира снимање и приказује се у траци изнад поља.
 */
export const greskeNaPoljima = (
  error: Http.HttpError,
  poljePoKodu: Record<string, string> = {},
): ReadonlyArray<Issue> =>
  poslovneGreske(error).map(g => ({
    path: poljePoKodu[g.code] === undefined ? [] : [poljePoKodu[g.code]],
    message: g.message,
    severity: g.severity === 'WARNING' ? ('warning' as const) : ('error' as const),
  }))
