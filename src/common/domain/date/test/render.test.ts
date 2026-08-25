import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import { changed, format, parse } from '../../field/date-field'
import * as DateDomain from '../index'

type Value = { readonly x: DateDomain.Form }

const options: Form.Options<Value> = { template: l => l.inputs.x }

const draw = (value: Value) =>
  renderToStaticMarkup(
    Form.render({ schema: Schema.Struct({ x: DateDomain.vForm }), value, onChange: () => {}, options }) as never,
  )

const vForm = () => Schema.Struct({ x: DateDomain.vForm })

describe('date domain', () => {
  it('should show the selected date in the serbian format', () => {
    expect(draw({ x: new Date(2026, 7, 6) })).toContain('06.08.2026.')
  })

  it('should show an empty field when nothing is picked', () => {
    expect(draw({ x: null })).not.toContain('2026')
  })

  it('should reject an empty field with the domain message', () => {
    const r = Form.validate(vForm, { x: null })
    expect(r.isValid).toBe(false)
    if (r.isValid) return
    expect(r.issues).toEqual([{ path: ['x'], message: 'Podatak je obavezan' }])
  })

  it('should reject an invalid date', () => {
    const r = Form.validate(vForm, { x: new Date('nope') })
    expect(r.isValid).toBe(false)
    if (r.isValid) return
    expect(r.issues).toEqual([{ path: ['x'], message: 'Unesite ispravan datum' }])
  })

  it('should accept a valid date', () => {
    const r = Form.validate(vForm, { x: new Date(2026, 7, 6) })
    expect(r.isValid).toBe(true)
  })
})

// DatePicker zove onSelectDate(null) na blur i na zatvaranje praznog polja, bez izbora.
describe('date change detection', () => {
  it('should ignore an empty pick on an empty field', () => {
    expect(changed(null, null)).toBe(false)
  })

  it('should ignore the same day handed back as a new instance', () => {
    expect(changed(new Date(2026, 7, 6), new Date(2026, 7, 6))).toBe(false)
  })

  it('should report a picked date', () => {
    expect(changed(new Date(2026, 7, 6), null)).toBe(true)
  })

  it('should report a cleared date', () => {
    expect(changed(null, new Date(2026, 7, 6))).toBe(true)
  })

  it('should report a different day', () => {
    expect(changed(new Date(2026, 7, 6), new Date(2026, 7, 7))).toBe(true)
  })
})

describe('date parsing', () => {
  it('should round-trip the formatted value', () => {
    const d = new Date(2026, 7, 6)
    expect(parse(format(d))?.getTime()).toBe(d.getTime())
  })

  it('should refuse a day that would roll over into the next month', () => {
    expect(parse('31.02.2026.')).toBe(null)
  })

  it('should refuse text that is not a date', () => {
    expect(parse('nije datum')).toBe(null)
  })
})
