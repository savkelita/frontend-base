import { describe, expect, it } from 'vitest'
import { contains, eq, predicateValue } from '../predicate'

describe('contains', () => {
  it('popunjeno polje daje predikat', () => {
    expect(contains('Pera')).toStrictEqual(['contains', 'Pera'])
  })

  it('prazno polje ne daje kriterijum', () => {
    expect(contains(null)).toBeUndefined()
    expect(contains('')).toBeUndefined()
  })

  it('razmak je unos, ne praznina — BE odlucuje sta ce sa njim', () => {
    expect(contains(' ')).toStrictEqual(['contains', ' '])
  })
})

describe('eq', () => {
  it('izabrana vrednost daje predikat', () => {
    expect(eq('AKTIVAN')).toStrictEqual(['eq', 'AKTIVAN'])
  })

  it('nista izabrano ne daje kriterijum', () => {
    expect(eq(null)).toBeUndefined()
  })
})

describe('predicateValue', () => {
  it('vraca vrednost, bez obzira na operator', () => {
    expect(predicateValue(['contains', 'Pera'])).toBe('Pera')
    expect(predicateValue(['starts_with', 'Pera'])).toBe('Pera')
    expect(predicateValue(['eq', 'AKTIVAN'])).toBe('AKTIVAN')
  })

  it('kriterijuma nema, pa ni vrednosti', () => {
    expect(predicateValue(undefined)).toBeNull()
  })

  // Ovo drzi obe strane: sto `contains` napravi, `predicateValue` vrati.
  it('vraca ono sto je uslo', () => {
    expect(predicateValue(contains('Pera'))).toBe('Pera')
    expect(predicateValue(eq('PASIVAN'))).toBe('PASIVAN')
  })
})
