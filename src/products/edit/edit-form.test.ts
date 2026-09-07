import { describe, it, expect } from 'vitest'
import { toDraft, toUpdateBody } from './form'

describe('products/edit form mappers', () => {
  it('toDraft encodes the record into the draft (numbers -> strings)', () => {
    expect(toDraft({ id: 5, title: 'Hat', category: 'beauty', price: 12.5, stock: 3, description: 'x' })).toEqual({
      title: 'Hat',
      category: 'beauty',
      price: '12.5',
      stock: '3',
      description: 'x',
    })
  })

  it('toUpdateBody injects id + version and drops the create-only category', () => {
    const body = toUpdateBody(
      { title: 'Hat', category: 'beauty', price: 12.5, stock: 3, description: 'x' },
      { id: 5, version: 2 },
    )
    expect(body).toEqual({ id: 5, version: 2, title: 'Hat', price: 12.5, stock: 3, description: 'x' })
    expect('category' in body).toBe(false)
  })
})
