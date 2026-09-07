import { describe, it, expect } from 'vitest'
import * as Http from 'tea-effect/Http'
import * as Combo from '../combo'
import { Form } from '..'
import type { FormModel } from './object'

const source = { request: () => Http.get('/x', Http.expectWhatever), toOptions: () => [] }
const pick = (v: string) => Combo.Msg.Picked({ option: { value: v, label: v } })
const comboVal = (model: FormModel<any>, path: string): string =>
  Combo.value((model.states as Record<string, Combo.Model>)[path])

const general = {
  warehouse: Form.combo({ label: 'Skladište', source }),
  location: Form.combo({ label: 'Lokacija', dependsOn: ['warehouse'], source }),
}
const lot = {
  lot: Form.combo({ label: 'Lot', dependsOn: ['warehouse'], source }),
}

const spec = Form.combine(
  { general, lot },
  { rebind: [{ field: 'lot.lot', dep: 'warehouse', to: 'general.warehouse' }] },
)

describe('Form.combine', () => {
  it('throws at build time on a dangling cross-section dependency', () => {
    expect(() => Form.combine({ lot })).toThrow(/does not exist/)
  })

  it('auto-disables dependent fields (same- and cross-section) until the parent is chosen', () => {
    const [m0] = spec.create()
    expect(spec.fieldUi(m0, 'general.location').enabled).toBe(false)
    expect(spec.fieldUi(m0, 'lot.lot').enabled).toBe(false)

    const [m1] = spec.update({ _tag: 'Field', key: 'general.warehouse', msg: pick('W1') }, m0)
    expect(spec.fieldUi(m1, 'general.location').enabled).toBe(true)
    expect(spec.fieldUi(m1, 'lot.lot').enabled).toBe(true) // cross-section, via rebind
  })

  it('changing the parent resets children across sections', () => {
    const [m0] = spec.create()
    let m = spec.update({ _tag: 'Field', key: 'general.warehouse', msg: pick('W1') }, m0)[0]
    m = spec.update({ _tag: 'Field', key: 'general.location', msg: pick('L1') }, m)[0]
    m = spec.update({ _tag: 'Field', key: 'lot.lot', msg: pick('X1') }, m)[0]
    expect(comboVal(m, 'general.location')).toBe('L1')
    expect(comboVal(m, 'lot.lot')).toBe('X1')

    const [m2] = spec.update({ _tag: 'Field', key: 'general.warehouse', msg: pick('W2') }, m)
    expect(comboVal(m2, 'general.warehouse')).toBe('W2')
    expect(comboVal(m2, 'general.location')).toBe('') // same-section reset
    expect(comboVal(m2, 'lot.lot')).toBe('') // cross-section reset
  })
})
