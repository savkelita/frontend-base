export const STRING_OPERATORS = ['eq', 'neq', 'contains', 'starts_with'] as const

export type StringOperator = (typeof STRING_OPERATORS)[number]

export const ENUM_OPERATORS = ['eq', 'neq', 'in'] as const

export type EnumOperator = (typeof ENUM_OPERATORS)[number]

export const DATE_OPERATORS = ['eq', 'before', 'after', 'before_or_same', 'after_or_same', 'between'] as const

export type DateOperator = (typeof DATE_OPERATORS)[number]

export type Operator = StringOperator | EnumOperator | DateOperator

export type RangeOperator = 'between'

export type ListOperator = 'in'

export type SingleOperator = Exclude<Operator, RangeOperator | ListOperator>

export const isRange = (operator: Operator): operator is RangeOperator => operator === 'between'

export const isList = (operator: Operator): operator is ListOperator => operator === 'in'

export const operatorLabel: Record<Operator, string> = {
  eq: 'Jednako',
  neq: 'Nije jednako',
  contains: 'Sadrzi',
  starts_with: 'Pocinje sa',
  before: 'Pre',
  after: 'Posle',
  before_or_same: 'Isti dan ili pre',
  after_or_same: 'Isti dan ili posle',
  between: 'Izmedju',
  in: 'Jedno od',
}

const CODE_POINT: Record<Operator, number> = {
  eq: 61,
  neq: 8800,
  contains: 8834,
  starts_with: 10205,
  before: 10204,
  after: 8888,
  before_or_same: 8804,
  after_or_same: 8805,
  between: 10719,
  in: 8714,
}

export const operatorIcon = (operator: Operator): string => String.fromCodePoint(CODE_POINT[operator])
