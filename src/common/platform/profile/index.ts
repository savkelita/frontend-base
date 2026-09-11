import type * as S from 'effect/Schema'
import type { AnyCriteria, PretragaRequest, PretragaResponse } from '../contract'

// -------------------------------------------------------------------------------------
// BackendProfile — једини слој који зна за облик жице
// -------------------------------------------------------------------------------------
//
// Аутентикација није овде: исти токен важи код оба backend-а, па XSRF и колачић стоје
// изнад профила, у `../http`. Профил носи само уговор.

export type ProfileId = 'java' | 'dotnet'

export type BackendProfile = {
  readonly id: ProfileId

  /** Облик путање. Java има три сегмента, .NET шест — вишак носи `useCase`. */
  readonly url: (base: string, useCase: string | null, operacija: string) => string

  /** Query string претраге: имена за страничење и паковање сорта. */
  readonly query: (request: PretragaRequest) => string

  /**
   * Шема која жичани облик одговора преводи у неутрални. Враћа се шема, не декодер, да
   * може право у `Http.expectJson`.
   */
  readonly pretraga: <A, I>(result: S.Schema<A, I>) => S.Schema<PretragaResponse<A>, any>

  /**
   * Који критеријум носи текст који корисник куца у combou. Java има један универзални
   * (`unetaVrednost` са оператором), .NET именује поље по combou и шаље голу вредност.
   */
  readonly comboTekst: (polje: string, tekst: string) => AnyCriteria
}

export { java } from './java'
export { dotnet } from './dotnet'
