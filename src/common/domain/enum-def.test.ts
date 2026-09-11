import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import { postaviPismo } from '../strings'
import { errorsOf } from './validate'
import { defineEnum } from './enum-def'

const Prioritet = defineEnum({ NIZAK: 'Низак', VISOK: 'Висок' })

describe('defineEnum', () => {
  it('изводи вредности, опције и ознаку из једне декларације', () => {
    expect(Prioritet.values).toEqual(['NIZAK', 'VISOK'])
    expect(Prioritet.opcije).toEqual([
      { value: 'NIZAK', label: 'Низак' },
      { value: 'VISOK', label: 'Висок' },
    ])
    expect(Prioritet.labelOf('VISOK')).toBe('Висок')
  })

  it('опције носе ћирилични извор — писмо бира вид при исцртавању', () => {
    postaviPismo('latinica')
    try {
      expect(Prioritet.opcije[0].label).toBe('Низак')
      expect(Prioritet.labelOf('NIZAK')).toBe('Nizak')
    } finally {
      postaviPismo('cirilica')
    }
  })

  it('`.Value` декодује само дозвољене вредности', () => {
    const dekoduj = Schema.decodeUnknownEither(Prioritet.Value)
    expect(dekoduj('VISOK')._tag).toBe('Right')
    expect(dekoduj('NEPOSTOJECI')._tag).toBe('Left')
  })

  it('`.field()` гради шему ограничену на вредности енумерације', () => {
    const S = Schema.Struct({ x: Prioritet.field() })
    expect(errorsOf(S, { x: '' }).x).toBe('Obavezno polje')
    expect(errorsOf(S, { x: 'nope' }).x).toBe('Nedozvoljena vrednost')
    expect(errorsOf(S, { x: 'NIZAK' }).x).toBeUndefined()
  })

  it('`.multiField()` гради шему за више вредности', () => {
    const S = Schema.Struct({ x: Prioritet.multiField({ optional: true }) })
    expect(errorsOf(S, { x: ['NIZAK', 'VISOK'] }).x).toBeUndefined()
    expect(errorsOf(S, { x: ['bad'] }).x).toBe('Nedozvoljena vrednost')
  })
})
