import { describe, it, expect } from 'vitest'
import { Schema, Either } from 'effect'
import { name, decimal } from '../domain'
import { errorsOf, decode } from './validate'

const TestForm = Schema.Struct({ title: name(), price: decimal({ min: 0 }) })

describe('form/validate', () => {
  describe('errorsOf', () => {
    it('reports required errors keyed by field for an empty draft', () => {
      const errors = errorsOf(TestForm, { title: '', price: '' })
      expect(errors.title).toBe('Obavezno polje')
      expect(errors.price).toBe('Obavezno polje')
    })

    it('reports only the invalid field', () => {
      const errors = errorsOf(TestForm, { title: 'Hat', price: 'x' })
      expect(errors.title).toBeUndefined()
      expect(errors.price).toBe('Unesite broj')
    })

    it('is empty for a valid draft', () => {
      expect(errorsOf(TestForm, { title: 'Hat', price: '9.99' })).toEqual({})
    })

    it('reports the range message for a negative number', () => {
      const errors = errorsOf(TestForm, { title: 'Hat', price: '-1' })
      expect(errors.price).toBe('Mora biti veće ili jednako 0')
    })
  })

  describe('decode', () => {
    it('produces a typed payload with parsed numbers', () => {
      const result = decode(TestForm, { title: 'Hat', price: '9.99' })
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual({ title: 'Hat', price: 9.99 })
      }
    })

    it('fails on an invalid draft', () => {
      expect(Either.isLeft(decode(TestForm, { title: '', price: 'x' }))).toBe(true)
    })
  })
})
