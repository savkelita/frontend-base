// @vitest-environment happy-dom
import { Option } from 'effect'
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import * as Http from 'tea-effect/Http'
import { afterEach, describe, expect, it } from 'vitest'
import type * as ComboDomain from '../domain/combo'
import { selected, typed } from '../domain/combo/msg'
import { ioPretragaResponse } from '../pretraga'
import { sBaseComboResult, type BaseComboResult } from '../../platform'
import { Form, comboMsg, type FieldRenderer } from '.'

const globals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }

globals.IS_REACT_ACT_ENVIRONMENT = true

// Форма са текстом, комбоом и бројем са доњом границом — таман толико да се провери да се
// из једне декларације изводи и вредност, и провера, и виџет, и стање претраге.

const izvor: ComboDomain.Source<BaseComboResult> = () =>
  Http.get('/test', Http.expectJson(ioPretragaResponse(sBaseComboResult)))

const JedinicaMereCombo = Form.combo({
  label: 'Јединица мере',
  io: sBaseComboResult,
  source: izvor,
  render: { id: item => item.id, render: item => `${item.sifra} - ${item.naziv}` },
})

const fields = {
  sifra: Form.code30({ label: 'Шифра' }),
  jedinicaMere: JedinicaMereCombo,
  kolicina: Form.decimal({ label: 'Количина', min: 0, initialValue: '1,00' }),
}

type Fields = typeof fields

const TestForm = Form.object(fields)

const layout = (field: FieldRenderer<Fields>) =>
  createElement('div', null, field('sifra'), field('jedinicaMere'), field('kolicina'))

const KOM: BaseComboResult = { id: 7, sifra: 'kom', naziv: 'Komad' }

let root: Root | undefined

afterEach(() => {
  if (root !== undefined) act(() => root?.unmount())
  root = undefined
  document.body.innerHTML = ''
})

const nacrtaj = (node: ReactNode): HTMLElement => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root?.render(node))
  return host
}

describe('Form.object', () => {
  it('почетну вредност изводи из декларације поља', () => {
    // Поље без `initialValue` креће од онога што је за тај домен празно.
    expect(TestForm.initial).toEqual({ sifra: null, jedinicaMere: null, kolicina: '1,00' })
    expect(TestForm.init.value).toEqual(TestForm.initial)
    expect(TestForm.init.showErrors).toBe(false)
  })

  it('почетна вредност је и мера за дирано, па поље са `initialValue` не пријави промену', () => {
    expect(TestForm.isDirty(TestForm.init)).toBe(false)
    expect(TestForm.isDirty(TestForm.initWith({ ...TestForm.initial, kolicina: '2,00' }))).toBe(true)
  })

  it('стање претраге држи само за combo поља', () => {
    expect(Object.keys(TestForm.init.combos)).toEqual(['jedinicaMere'])
  })

  it('избор из комбоа улази у вредност форме без иједне гране на екрану', () => {
    const [model] = TestForm.update(comboMsg<Fields>('jedinicaMere', selected([KOM])), TestForm.init)

    expect(model.value.jedinicaMere).toEqual(KOM)
  })

  it('куцање помера стање претраге, а не вредност', () => {
    const [model] = TestForm.update(comboMsg<Fields>('jedinicaMere', typed('ko')), TestForm.init)

    expect(model.combos.jedinicaMere.input).toBe('ko')
    expect(model.combos.jedinicaMere.open).toBe(true)
    expect(model.value.jedinicaMere).toBeNull()
  })

  it('submit пали приказ грешака и не даје вредност док форма није исправна', () => {
    const [model, vrednost] = TestForm.submit(TestForm.init)

    expect(Option.isNone(vrednost)).toBe(true)
    expect(model.showErrors).toBe(true)
  })

  it('submit даје декодовану вредност кад је форма исправна', () => {
    const popunjena = TestForm.initWith({ sifra: 'A1', jedinicaMere: KOM, kolicina: '2,50' })

    const [, vrednost] = TestForm.submit(popunjena)

    expect(Option.getOrNull(vrednost)).toEqual({ sifra: 'A1', jedinicaMere: KOM, kolicina: 2.5 })
  })

  it('граница задата уз поље се стварно проверава', () => {
    const ispod = TestForm.initWith({ sifra: 'A1', jedinicaMere: KOM, kolicina: '-1' })

    expect(Option.isNone(TestForm.submit(ispod)[1])).toBe(true)
  })

  it('дирано стање пореди избор по идентификатору', () => {
    const izabrano = TestForm.initWith({ ...TestForm.initial, jedinicaMere: KOM })
    const istiRed = TestForm.initWith({ ...TestForm.initial, jedinicaMere: { id: 7, sifra: 'kom', naziv: 'Комад' } })

    expect(TestForm.isDirty(TestForm.init)).toBe(false)
    expect(TestForm.isDirty(izabrano)).toBe(true)
    expect(TestForm.isDirty(istiRed, izabrano.value)).toBe(false)
  })

  it('исцртава сва поља са ознакама из исте декларације', () => {
    const host = nacrtaj(TestForm.render(TestForm.init, layout)(() => undefined))

    expect([...host.querySelectorAll('label')].map(l => l.textContent?.trim())).toEqual([
      'Шифра*',
      'Јединица мере*',
      'Количина*',
    ])
  })

  it('комбоу стиже његово стање, па отворена листа исцртава понуду', () => {
    const [model] = TestForm.update(comboMsg<Fields>('jedinicaMere', selected([KOM])), TestForm.init)

    const host = nacrtaj(TestForm.render(model, layout)(() => undefined))

    expect(host.querySelector<HTMLInputElement>('input[role="combobox"]')?.value).toBe('kom - Komad')
  })

  it('поруке о грешци се виде тек пошто се покуша снимање', () => {
    const prazna = nacrtaj(TestForm.render(TestForm.init, layout)(() => undefined))
    expect(prazna.textContent).not.toContain('Podatak je obavezan')

    act(() => root?.unmount())
    root = undefined

    const [posle] = TestForm.submit(TestForm.init)
    const sGreskama = nacrtaj(TestForm.render(posle, layout)(() => undefined))
    expect(sGreskama.textContent).toContain('Podatak je obavezan')
  })
})
