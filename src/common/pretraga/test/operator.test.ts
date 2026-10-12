import { describe, expect, it } from 'vitest'
import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  STRING_OPERATORS,
  isList,
  isRange,
  operatorIcon,
  operatorLabel,
  type Operator,
} from '../operator'

const all: ReadonlyArray<Operator> = [...new Set<Operator>([...STRING_OPERATORS, ...ENUM_OPERATORS, ...DATE_OPERATORS])]

describe('operatori', () => {
  it('svaki operator ima naziv', () => {
    expect(all.filter(one => operatorLabel[one] === undefined)).toStrictEqual([])
  })

  it('nijedan naziv nema dijakritiku', () => {
    expect(Object.values(operatorLabel).filter(one => /[čćšžđČĆŠŽĐ]/.test(one))).toStrictEqual([])
  })

  it('znak je jedan karakter', () => {
    expect(all.filter(one => [...operatorIcon(one)].length !== 1)).toStrictEqual([])
  })

  it('znak se pise kodnom tackom, ne karakterom u izvoru', () => {
    expect(operatorIcon('contains').codePointAt(0)).toBe(8834)
    expect(operatorIcon('eq')).toBe('=')
  })

  it('unutar jednog tipa polja znakovi se ne ponavljaju', () => {
    for (const literals of [STRING_OPERATORS, ENUM_OPERATORS, DATE_OPERATORS]) {
      const icons = literals.map(operatorIcon)
      expect(new Set(icons).size).toBe(icons.length)
    }
  })
})

describe('koliko vrednosti operator trazi', () => {
  it('between trazi opseg', () => {
    expect(all.filter(isRange)).toStrictEqual(['between'])
  })

  it('in trazi listu', () => {
    expect(all.filter(isList)).toStrictEqual(['in'])
  })

  it('svi ostali traze jednu vrednost', () => {
    expect(all.filter(one => !isRange(one) && !isList(one))).toStrictEqual([
      'eq',
      'neq',
      'contains',
      'starts_with',
      'before',
      'after',
      'before_or_same',
      'after_or_same',
    ])
  })
})
