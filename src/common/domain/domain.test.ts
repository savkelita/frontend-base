import { describe, it, expect } from 'vitest'
import { Schema, Either } from 'effect'
import { errorsOf, decode } from './validate'
import { code10, desc, date, datetime, int, decimal, enumOf, multiEnumOf } from '.'

// helper: error message for the single field `x`, or undefined
const err = <A, I>(schema: Schema.Schema<A, I>, value: I): string | undefined =>
  errorsOf(Schema.Struct({ x: schema } as never), { x: value } as never).x

describe('domain types', () => {
  describe('text (code10)', () => {
    it('is required by default and enforces max length', () => {
      expect(err(code10(), '')).toBe('Obavezno polje')
      expect(err(code10(), '12345678901')).toBe('Najviše 10 karaktera')
      expect(err(code10(), 'ABC123')).toBeUndefined()
    })

    it('runs a custom validation', () => {
      const startsWithLetter = code10({ validate: v => (/^[A-Za-z]/.test(v) ? undefined : 'Mora počinjati slovom') })
      expect(err(startsWithLetter, '1AB')).toBe('Mora počinjati slovom')
      expect(err(startsWithLetter, 'A12')).toBeUndefined()
    })
  })

  describe('optional', () => {
    it('allows an empty value with no error', () => {
      expect(err(desc({ optional: true }), '')).toBeUndefined()
      expect(err(enumOf(['a', 'b'], { optional: true }), '')).toBeUndefined()
    })

    it('still requires the value when not optional', () => {
      expect(err(desc(), '')).toBe('Obavezno polje')
    })
  })

  describe('date with custom rule', () => {
    const notAfter2020 = date({ validate: v => (v <= '2020-01-01' ? undefined : 'Datum ne može biti u budućnosti') })
    it('rejects and accepts per the rule', () => {
      expect(err(notAfter2020, '2099-01-01')).toBe('Datum ne može biti u budućnosti')
      expect(err(notAfter2020, '2019-06-15')).toBeUndefined()
    })
  })

  describe('datetime (payload is a Date; both date + time required)', () => {
    it('requires a complete value and decodes it to a Date', () => {
      expect(err(datetime() as never, '')).toBe('Obavezno polje')
      expect(err(datetime() as never, '2024-05-01')).toBe('Unesite datum i vreme')
      const decoded = Either.getOrThrow(decode(Schema.Struct({ x: datetime() }), { x: '2024-05-01T14:30' }))
      expect(decoded.x).toBeInstanceOf(Date)
      expect((decoded.x as Date).getFullYear()).toBe(2024)
      expect((decoded.x as Date).getHours()).toBe(14)
    })

    it('optional decodes an empty input to undefined', () => {
      expect(Either.getOrThrow(decode(Schema.Struct({ x: datetime({ optional: true }) }), { x: '' }))).toEqual({
        x: undefined,
      })
    })
  })

  describe('numbers', () => {
    it('int rejects non-integers and decodes to a number', () => {
      expect(err(int(), '')).toBe('Obavezno polje')
      expect(err(int(), '1.5')).toBe('Unesite ceo broj')
      expect(Either.getOrThrow(decode(Schema.Struct({ x: int() }), { x: '3' }))).toEqual({ x: 3 })
    })

    it('decimal honours min and accepts comma decimals', () => {
      expect(err(decimal({ min: 0 }), '-1')).toBe('Mora biti veće ili jednako 0')
      expect(Either.getOrThrow(decode(Schema.Struct({ x: decimal() }), { x: '2,5' }))).toEqual({ x: 2.5 })
    })

    it('optional number decodes an empty input to undefined', () => {
      expect(Either.getOrThrow(decode(Schema.Struct({ x: int({ optional: true }) }), { x: '' }))).toEqual({
        x: undefined,
      })
    })
  })

  describe('enum (single & multi)', () => {
    it('single enum constrains to the allowed set', () => {
      expect(err(enumOf(['a', 'b']), '')).toBe('Obavezno polje')
      expect(err(enumOf(['a', 'b']), 'c')).toBe('Nedozvoljena vrednost')
      expect(err(enumOf(['a', 'b']), 'a')).toBeUndefined()
    })

    it('multi enum requires at least one unless optional', () => {
      expect(err(multiEnumOf(['a', 'b']), [])).toBe('Izaberite bar jednu vrednost')
      expect(err(multiEnumOf(['a', 'b']), ['a', 'z'])).toBe('Nedozvoljena vrednost')
      expect(err(multiEnumOf(['a', 'b'], { optional: true }), [])).toBeUndefined()
    })
  })
})
