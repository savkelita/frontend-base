import { describe, it, expect } from 'vitest'
import { Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import * as Combo from '../combo'
import { Form } from '..'

const source = { request: () => Http.get('/x', Http.expectWhatever), toOptions: () => [] }

const spec = Form.object(
  {
    title: Form.name({ label: 'Naziv' }),
    grupa: Form.combo({ label: 'Grupa', source }),
    podgrupa: Form.combo({ label: 'Podgrupa', dependsOn: ['grupa'], source }),
  },
  { effects: [{ when: 'grupa', run: () => Cmd.none }] },
)

const pick = (value: string) => Combo.Msg.Picked({ option: { value, label: value } })

describe('combo id decoding', () => {
  it('a combo sends the selected id as a number by default (string with numeric: false)', () => {
    const asNumber = Form.combo({ label: 'Grupa', source })
    expect(Schema.decodeUnknownSync(asNumber.schema)('5')).toBe(5)
    const asString = Form.combo({ label: 'Grupa', source, numeric: false })
    expect(Schema.decodeUnknownSync(asString.schema)('5')).toBe('5')
  })

  it('a multi combo decodes the selected ids to numbers', () => {
    const multi = Form.multiCombo({ label: 'Proizvodi', source, optional: true })
    expect(Schema.decodeUnknownSync(multi.schema)(['1', '2', '3'])).toEqual([1, 2, 3])
  })
})

describe('Form.object', () => {
  it('create() starts Editing, empty, not dirty', () => {
    const [model] = spec.create()
    expect(model.status).toBe('Editing')
    expect(spec.isDirty(model)).toBe(false)
    expect(spec.fieldUi(model, 'title').dirty).toBe(false)
  })

  it('a value field change updates draft, marks dirty + touched', () => {
    const [m0] = spec.create()
    const [m1] = spec.update({ _tag: 'Field', key: 'title', msg: 'Hat' }, m0)
    expect(spec.fieldUi(m1, 'title').dirty).toBe(true)
    expect(spec.fieldUi(m1, 'title').touched).toBe(true)
    expect(spec.isDirty(m1)).toBe(true)
  })

  it('picking the parent resets the (transitive) child', () => {
    const [m0] = spec.create()
    const [m1] = spec.update({ _tag: 'Field', key: 'grupa', msg: pick('1') }, m0)
    const [m2] = spec.update({ _tag: 'Field', key: 'podgrupa', msg: pick('11') }, m1)
    expect(Combo.value(m2.states.podgrupa)).toBe('11')

    const [m3] = spec.update({ _tag: 'Field', key: 'grupa', msg: pick('2') }, m2)
    expect(Combo.value(m3.states.grupa)).toBe('2')
    expect(Combo.value(m3.states.podgrupa)).toBe('') // reset by cascade
  })

  it('typing in the parent (not a selection) does NOT reset the child', () => {
    const [m0] = spec.create()
    const [m1] = spec.update({ _tag: 'Field', key: 'grupa', msg: pick('1') }, m0)
    const [m2] = spec.update({ _tag: 'Field', key: 'podgrupa', msg: pick('11') }, m1)
    const [m3] = spec.update({ _tag: 'Field', key: 'grupa', msg: Combo.Msg.QueryChanged({ query: 'ab' }) }, m2)
    expect(Combo.value(m3.states.podgrupa)).toBe('11')
  })

  it('child is disabled until the parent is chosen (from dependsOn)', () => {
    const [m0] = spec.create()
    expect(spec.fieldUi(m0, 'podgrupa').enabled).toBe(false)
    const [m1] = spec.update({ _tag: 'Field', key: 'grupa', msg: pick('1') }, m0)
    expect(spec.fieldUi(m1, 'podgrupa').enabled).toBe(true)
  })

  it('Set writes a value programmatically (autofill), silently', () => {
    const [m0] = spec.create()
    const [m1] = spec.update({ _tag: 'Set', key: 'grupa', value: '7' }, m0)
    expect(Combo.value(m1.states.grupa)).toBe('7')
  })

  it('trySubmit: invalid -> None + submitAttempted; valid -> Some(payload) + Submitting', () => {
    const [m0] = spec.create()
    const [mInvalid, out1] = spec.trySubmit(m0)
    expect(Option.isNone(out1)).toBe(true)
    expect(mInvalid.submitAttempted).toBe(true)

    let m = spec.update({ _tag: 'Field', key: 'title', msg: 'Hat' }, m0)[0]
    m = spec.update({ _tag: 'Field', key: 'grupa', msg: pick('1') }, m)[0]
    m = spec.update({ _tag: 'Field', key: 'podgrupa', msg: pick('11') }, m)[0]
    const [mValid, out2] = spec.trySubmit(m)
    expect(mValid.status).toBe('Submitting')
    expect(Option.isSome(out2)).toBe(true)
    // combos decode their ids to numbers by default
    if (Option.isSome(out2)) expect(out2.value).toEqual({ title: 'Hat', grupa: 1, podgrupa: 11 })
  })

  it('View mode disables everything', () => {
    const [model] = spec.view({ title: 'Hat', grupa: '1', podgrupa: '11' })
    expect(spec.fieldUi(model, 'title').enabled).toBe(false)
    expect(spec.fieldUi(model, 'title').readonly).toBe(true)
  })
})
