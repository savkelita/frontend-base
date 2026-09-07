import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import { errorsOf } from './validate'
import { defineEnum } from './enum-def'

const Priority = defineEnum([
  { value: 'low', label: 'Nizak' },
  { value: 'high', label: 'Visok' },
])

describe('defineEnum', () => {
  it('derives values, options and labelOf from one definition', () => {
    expect(Priority.values).toEqual(['low', 'high'])
    expect(Priority.options).toEqual([
      { value: 'low', label: 'Nizak' },
      { value: 'high', label: 'Visok' },
    ])
    expect(Priority.labelOf('high')).toBe('Visok')
    expect(Priority.labelOf('unknown')).toBe('unknown')
  })

  it('.field() builds a schema constrained to the enum values', () => {
    const S = Schema.Struct({ x: Priority.field() })
    expect(errorsOf(S, { x: '' }).x).toBe('Obavezno polje')
    expect(errorsOf(S, { x: 'nope' }).x).toBe('Nedozvoljena vrednost')
    expect(errorsOf(S, { x: 'low' }).x).toBeUndefined()
  })

  it('.multiField() builds a multi-value schema over the same values', () => {
    const S = Schema.Struct({ x: Priority.multiField({ optional: true }) })
    expect(errorsOf(S, { x: ['low', 'high'] }).x).toBeUndefined()
    expect(errorsOf(S, { x: ['bad'] }).x).toBe('Nedozvoljena vrednost')
  })
})
