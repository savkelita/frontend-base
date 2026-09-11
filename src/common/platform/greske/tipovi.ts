import * as S from 'effect/Schema'

// -------------------------------------------------------------------------------------
// Envelope грешке — исти у обе фамилије
// -------------------------------------------------------------------------------------
//
// Backend на 400 враћа низ грешака. Ово је једна од четири ствари око којих се не преговара
// — облик је бајт-идентичан и на Java и на .NET страни.

export const sSeverity = S.Literal('ERROR', 'WARNING')
export type Severity = typeof sSeverity.Type

/** Пословно правило: једино што носи `severity` и `messageCode`. */
export const sPoslovnaGreska = S.Struct({
  type: S.Literal('BUSINESS'),
  code: S.String,
  messageCode: S.String,
  message: S.String,
  severity: sSeverity,
})
export type PoslovnaGreska = typeof sPoslovnaGreska.Type

export const sSistemskaGreska = S.Struct({
  type: S.Literal('SYSTEM'),
  code: S.String,
  message: S.String,
})
export type SistemskaGreska = typeof sSistemskaGreska.Type

/** Предуслов који није испуњен — нпр. паковање које магацин не познаје. */
export const sPreduslovGreska = S.Struct({
  type: S.Literal('PRECONDITION'),
  message: S.String,
})
export type PreduslovGreska = typeof sPreduslovGreska.Type

export const sGreska = S.Union(sPoslovnaGreska, sSistemskaGreska, sPreduslovGreska)
export type Greska = typeof sGreska.Type

export const sGreske = S.Array(sGreska)

/** Шта се показује кориснику. */
export type ErrorReport = {
  readonly message: string
  readonly severity: Severity
}
