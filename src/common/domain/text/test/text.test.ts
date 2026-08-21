import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import * as Code10 from '../../code10'
import * as Code30 from '../../code30'
import * as Desc from '../../desc'
import * as Name from '../../name'
import type * as Text from '../index'

const check = <A, I, R>(schema: Schema.Schema<A, I, R>, value: Text.Form) =>
  Form.validate(() => Schema.Struct({ x: schema }), { x: value })

const message = <A, I, R>(schema: Schema.Schema<A, I, R>, value: Text.Form) => {
  const r = check(schema, value)
  return r.isValid ? undefined : r.issues[0]?.message
}

const cases = [
  { name: 'code10', schema: Code10.vForm, max: Code10.MAX_LENGTH },
  { name: 'code30', schema: Code30.vForm, max: Code30.MAX_LENGTH },
  { name: 'desc', schema: Desc.vForm, max: Desc.MAX_LENGTH },
  { name: 'name', schema: Name.vForm, max: Name.MAX_LENGTH },
] as const

describe('bounded text domains', () => {
  it('should each carry their own limit', () => {
    expect(cases.map(c => c.max)).toEqual([10, 30, 255, 80])
  })

  cases.forEach(({ name, schema, max }) => {
    describe(name, () => {
      it('should accept a value exactly at the limit', () => {
        expect(check(schema, 'x'.repeat(max)).isValid).toBe(true)
      })

      it('should reject one character over the limit', () => {
        expect(message(schema, 'x'.repeat(max + 1))).toBe(`Unesena vrednost ne sme biti duza od ${max} karaktera`)
      })

      it('should reject an empty value', () => {
        expect(message(schema, null)).toBe('Podatak je obavezan')
      })

      it('should reject a value that is only whitespace', () => {
        expect(message(schema, '   ')).toBe('Podatak je obavezan')
      })

      it('should measure the trimmed value, not the typed one', () => {
        expect(check(schema, `  ${'x'.repeat(max)}  `).isValid).toBe(true)
      })

      it('should decode to the trimmed value', () => {
        const r = check(schema, '  abc  ')
        expect(r.isValid).toBe(true)
        if (r.isValid) expect(r.value.x).toBe('abc')
      })
    })
  })
})
