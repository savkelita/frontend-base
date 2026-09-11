import { Either, Schema as S } from 'effect'

// -------------------------------------------------------------------------------------
// Конфигурација при подизању (runtime)
// -------------------------------------------------------------------------------------
//
// Иста грађевина се диже под више префикса без поновног превођења: `config.json` стоји
// поред `index.html`, а `entrypoint.sh` га препише при подизању контејнера. Зато префикс
// не сме да уђе у bundle — ни као `process.env`, ни као подразумевана вредност.
//
// **Без тихог одступања.** Ако `config.json` изостане или не ваља, апликација стаје и
// каже зашто. Тиха подразумевана вредност значи да се погрешан префикс примети тек кад
// корисник пријави да „ништа не ради", а до тада се тражи на погрешном месту.

export const sKonfiguracija = S.Struct({
  /** Префикс под којим апликација стоји: `/` или `/Magacin1`. */
  basePath: S.String,
  /** Префикс испред сваке руте ка backend-у. Празно кад је исти origin без префикса. */
  apiUrl: S.String,
  /** Почетно писмо; корисник га мења, преференца се памти. */
  pismo: S.Literal('cirilica', 'latinica'),
  environment: S.String,
  /** Име инстанце кад их једно окружење има више (`Ink1`, `Ink2`). */
  instanceName: S.optional(S.String),
})

export type Konfiguracija = typeof sKonfiguracija.Type

/** Води на леву страну кад конфигурације нема — `index.tsx` то претвара у видљив екран. */
export const procitaj = (sirovo: unknown): Either.Either<Konfiguracija, string> => {
  if (sirovo === undefined || sirovo === null) {
    return Either.left('Конфигурација није учитана: config.json недостаје или се није преузео.')
  }
  return Either.mapLeft(
    S.decodeUnknownEither(sKonfiguracija)(sirovo),
    razlog => `config.json није исправан: ${razlog.message}`,
  )
}

/**
 * Префикс сведен на један облик: празно за корен, иначе водећа коса црта без завршне.
 * Тако се свуда даље само надовезује — `basePath() + '/otpremnice'` — без иједне провере.
 */
export const normalizujPrefiks = (sirov: string): string => {
  const oljusten = sirov.trim()
  if (oljusten === '' || oljusten === '/') return ''
  return '/' + oljusten.replace(/^\/+/, '').replace(/\/+$/, '')
}

// `index.html` уписује конфигурацију у глобални опсег пре него што bundle крене. Чита се
// преко `globalThis` а не `window`, да исти модул ради и у тестовима.
const ucitana = procitaj((globalThis as { __RUNTIME_CONFIG__?: unknown }).__RUNTIME_CONFIG__)

/** Грешка при читању конфигурације, ако је било. */
export const greska = (): string | undefined => (Either.isLeft(ucitana) ? ucitana.left : undefined)

/**
 * Конфигурација. Зове се тек пошто је `index.tsx` проверио `greska()`, па је бацање овде
 * знак програмерске грешке, не погрешног окружења.
 */
export const konfiguracija = (): Konfiguracija => {
  if (Either.isLeft(ucitana)) throw new Error(ucitana.left)
  return ucitana.right
}

export const basePath = (): string => normalizujPrefiks(konfiguracija().basePath)

export const apiUrl = (): string => konfiguracija().apiUrl.replace(/\/+$/, '')

export const pismo = (): Konfiguracija['pismo'] => konfiguracija().pismo

export const okruzenje = (): string => {
  const { environment, instanceName } = konfiguracija()
  return instanceName ? `${environment} (${instanceName})` : environment
}
