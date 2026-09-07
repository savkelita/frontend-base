import { describe, it, expect } from 'vitest'
import { Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type { Payload } from '..'
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

  it('retyping the same value is not a change (no cascade, no effects)', () => {
    const withTextParent = Form.object({
      code: Form.code30({ label: 'Šifra' }),
      child: Form.combo({ label: 'Dete', dependsOn: 'code', source }),
    })
    let m = withTextParent.update({ _tag: 'Field', key: 'code', msg: 'AB' }, withTextParent.create()[0])[0]
    m = withTextParent.update({ _tag: 'Field', key: 'child', msg: pick('11') }, m)[0]

    const [same] = withTextParent.update({ _tag: 'Field', key: 'code', msg: 'AB' }, m)
    expect(Combo.value(same.states.child)).toBe('11')

    const [edited] = withTextParent.update({ _tag: 'Field', key: 'code', msg: 'ABC' }, m)
    expect(Combo.value(edited.states.child)).toBe('')
  })

  it('a multi field is not dirty just because its value is read as a fresh array', () => {
    const withMulti = Form.object({ items: Form.multiCombo({ label: 'Stavke', source, optional: true }) })
    const [model] = withMulti.edit({ items: ['1', '2'] })
    expect(withMulti.isDirty(model)).toBe(false)
    expect(withMulti.fieldUi(model, 'items').dirty).toBe(false)
  })
})

// -------------------------------------------------------------------------------------
// Readonly polja
// -------------------------------------------------------------------------------------

describe('Form.object readonly fields', () => {
  const fields = {
    status: Form.enumField({ label: 'Status', options: [{ value: 'new', label: 'Novi' }] }),
    title: Form.name({ label: 'Naziv' }),
  }
  // 'retired' je vrednost koju šema više ne dozvoljava — star zapis koji prethodi sadašnjem
  // spisku opcija.
  const legacy = { status: 'retired', title: 'Hat' }

  it('an editable field with a rejected value blocks the save (the user can fix it)', () => {
    const editable = Form.object(fields)
    const [, payload] = editable.trySubmit(editable.edit(legacy)[0])
    expect(Option.isNone(payload)).toBe(true)
  })

  it('a readonly field with the same value does not block the save', () => {
    const locked = Form.object(fields, { rules: () => ({ status: { readonly: true } }) })
    const [model, payload] = locked.trySubmit(locked.edit(legacy)[0])
    expect(Option.isSome(payload)).toBe(true)
    // vrednost koju korisnik ne može da promeni prolazi onakva kakva je sačuvana
    if (Option.isSome(payload)) expect(payload.value.status).toBe('retired')
    expect(locked.fieldUi(model, 'status').issues).toEqual([])
  })
})

// -------------------------------------------------------------------------------------
// Tipiziranost payload-a (provera pri kompajliranju; `yarn checkts` proverava i testove)
// -------------------------------------------------------------------------------------
//
// `Equals` je false za `any`, pa ove dodele prestaju da se kompajliraju čim neko polje
// prestane da provuče svoj dekodovani tip do payload-a.

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

export const typed = {
  title: Form.name({ label: 'Naziv' }),
  price: Form.decimal({ label: 'Cena' }),
  rabat: Form.decimal({ label: 'Rabat', optional: true }),
  rok: Form.datetime({ label: 'Rok' }),
  published: Form.flag({ label: 'Objavljen' }),
  oznake: Form.multiEnum({ label: 'Oznake', options: [{ value: 'a', label: 'A' }], optional: true }),
  grupa: Form.combo({ label: 'Grupa', source }),
  podgrupa: Form.combo({ label: 'Podgrupa', source, optional: true }),
  sifra: Form.combo({ label: 'Šifra', source, numeric: false }),
  stavke: Form.multiCombo({ label: 'Stavke', source, optional: true }),
}
type P = Payload<typeof typed>

export const payloadTypes: [
  Equals<P['title'], string>,
  Equals<P['price'], number>,
  Equals<P['rabat'], number | undefined>,
  Equals<P['rok'], Date>,
  Equals<P['published'], boolean>,
  Equals<P['oznake'], ReadonlyArray<string>>,
  Equals<P['grupa'], number>,
  Equals<P['podgrupa'], number | undefined>,
  Equals<P['sifra'], string>,
  Equals<P['stavke'], ReadonlyArray<number>>,
] = [true, true, true, true, true, true, true, true, true, true]
