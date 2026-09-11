import type { OperatorBroj, OperatorDatum, OperatorTekst } from '../platform'

// -------------------------------------------------------------------------------------
// Оператори филтера
// -------------------------------------------------------------------------------------
//
// Предикатски филтер (`[оператор, вредност]`) постоји само на Java страни. iDEA генерише
// критеријуме без оператора, па .NET модул сме да користи само обичну варијанту поља —
// проверу ради `napraviFilter` при састављању, да пукне одмах а не у продукцији.

export const OPERATORI_TEKST: Readonly<Record<OperatorTekst, string>> = {
  contains: 'садржи',
  eq: 'једнако',
  neq: 'различито',
  starts_with: 'почиње са',
}

export const OPERATORI_BROJ: Readonly<Record<OperatorBroj, string>> = {
  eq: 'једнако',
  neq: 'различито',
  lt: 'мање од',
  lte: 'мање или једнако',
  gt: 'веће од',
  gte: 'веће или једнако',
  between: 'између',
}

export const OPERATORI_DATUM: Readonly<Record<OperatorDatum, string>> = {
  eq: 'на дан',
  before: 'пре',
  after: 'после',
  before_or_same: 'до',
  after_or_same: 'од',
  between: 'између',
}

export type { OperatorBroj, OperatorDatum, OperatorTekst }
export type Operator = OperatorTekst | OperatorBroj | OperatorDatum

/** Ознака оператора у падајућем менију уз поље. */
export type SkupOperatora = Readonly<Record<string, string>>

/**
 * Оператор `between` носи две вредности, а на жици их шаље као једну — спојене тилдом
 * (`2024-01-01~2024-02-01`). Тако раде затечени пројекти, па остаје исто.
 */
export const IZMEDJU = 'between'
export const RAZDVAJAC = '~'

export const jeIzmedju = (operator: string): boolean => operator === IZMEDJU

/** Половине `between` вредности; за остале операторе друга половина је празна. */
export const polovine = (vrednost: string): readonly [string, string] => {
  const [od = '', ...ostatak] = vrednost.split(RAZDVAJAC)
  return [od, ostatak.join(RAZDVAJAC)]
}

export const spoji = (od: string, doVrednosti: string): string => od + RAZDVAJAC + doVrednosti
