// @vitest-environment happy-dom
import { Option, Schema } from 'effect'
import type { ReactNode } from 'react'
import * as Router from 'tea-effect/Router'
import { afterEach, describe, expect, it } from 'vitest'
import { click, input, menuItems, mount, type as otkucaj, unmount } from '../../../testing/dom'
import * as Form from '../../form'
import * as TextFilter from '../filter-text'
import { operatorIcon, type StringOperator } from '../operator'
import { ioStringPredicateOf } from '../predicate'
import { pretragaQuery } from '../query'

afterEach(unmount)

type Value = { readonly polje: TextFilter.Form }

const draw = (operators: ReadonlyArray<StringOperator>, value: TextFilter.Form, changes: Array<Value> = []): void =>
  mount(
    Form.render({
      schema: Schema.Struct({ polje: TextFilter.vForm(operators) }),
      value: { polje: value },
      onChange: next => changes.push(next),
      options: {
        template: locals => locals.inputs.polje as ReactNode,
        fields: { polje: { label: 'Registarska oznaka' } },
      },
      issues: [],
      ctx: { disabled: false },
    }) as ReactNode,
  )

const trigger = (): HTMLButtonElement | null => document.querySelector('button')

describe('tekstualno polje filtera', () => {
  const SVE: ReadonlyArray<StringOperator> = ['contains', 'starts_with', 'eq', 'neq']

  it('prazno polje pokazuje prvi ponudjeni operator', () => {
    draw(SVE, null)

    expect(trigger()?.textContent).toBe(operatorIcon('contains'))
  })

  it('pokazuje operator koji je u vrednosti, ne prvi', () => {
    draw(SVE, ['starts_with', 'BG'])

    expect(trigger()?.textContent).toBe(operatorIcon('starts_with'))
    expect(input().value).toBe('BG')
  })

  it('jedan operator ne prikazuje meni', () => {
    draw(['contains'], null)

    expect(trigger()).toBeNull()
    expect(input()).toBeDefined()
  })

  it('kucanje zadrzava izabran operator', () => {
    const changes: Array<Value> = []
    draw(SVE, ['starts_with', 'B'], changes)

    otkucaj('BG')

    expect(changes).toStrictEqual([{ polje: ['starts_with', 'BG'] }])
  })

  it('promena operatora zadrzava otkucanu vrednost', () => {
    const changes: Array<Value> = []
    draw(SVE, ['contains', 'BG'], changes)

    click(trigger() ?? undefined)
    click(menuItems()[1])

    expect(changes).toStrictEqual([{ polje: ['starts_with', 'BG'] }])
  })

  it('labela pokazuje na polje za unos, ne na dugme operatora', () => {
    draw(SVE, null)

    expect(document.querySelector('label')?.getAttribute('for')).toBe(input().id)
  })

  it('filter nije obavezno polje, pa nema zvezdicu', () => {
    draw(SVE, null)

    expect(document.body.textContent).not.toContain('*')
  })
})

describe('toCriteria', () => {
  it('prazno polje ne daje kriterijum', () => {
    expect(TextFilter.toCriteria(null)).toBeUndefined()
    expect(TextFilter.toCriteria(['contains', ''])).toBeUndefined()
    expect(TextFilter.toCriteria(['contains', '   '])).toBeUndefined()
  })

  it('vrednost se podseca', () => {
    expect(TextFilter.toCriteria(['starts_with', '  BG  '])).toStrictEqual(['starts_with', 'BG'])
  })

  it('operator ide onakav kakav je izabran', () => {
    expect(TextFilter.toCriteria(['neq', 'BG'])).toStrictEqual(['neq', 'BG'])
  })
})

describe('suzen skup operatora', () => {
  const DOZVOLJENI: TextFilter.Operators = ['contains', 'starts_with']

  const routes = Router.routes({
    proba: Router.path('/proba').query(
      pretragaQuery(
        Schema.Struct({ polje: Schema.optional(ioStringPredicateOf(DOZVOLJENI)) }),
        Schema.Literal('polje'),
      ),
    ),
  })

  const parse = (search: string): string => {
    const found = Router.parse(routes, { pathname: '/proba', search })
    return Option.isNone(found) ? '404' : JSON.stringify(found.value.query)
  }

  it('dozvoljen operator prolazi kroz rutu', () => {
    expect(parse('?polje=contains&polje=BG')).toBe('{"polje":["contains","BG"]}')
    expect(parse('?polje=starts_with&polje=BG')).toBe('{"polje":["starts_with","BG"]}')
  })

  it('nedozvoljen operator nema rutu, isto kao pogresna vrednost enuma', () => {
    expect(parse('?polje=neq&polje=BG')).toBe('404')
    expect(parse('?polje=eq&polje=BG')).toBe('404')
  })

  it('izmisljen operator nema rutu', () => {
    expect(parse('?polje=lajk&polje=BG')).toBe('404')
  })

  it('meni nudi tacno ono sto ruter prima', () => {
    draw(DOZVOLJENI, null)

    click(trigger() ?? undefined)

    expect(menuItems()).toHaveLength(DOZVOLJENI.length)
  })
})
