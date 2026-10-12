// @vitest-environment happy-dom
import { Option, Schema } from 'effect'
import type { ReactNode } from 'react'
import * as Router from 'tea-effect/Router'
import { afterEach, describe, expect, it } from 'vitest'
import { click, input, inputs, menuItems, mount, type as otkucaj, unmount } from '../../../testing/dom'
import * as Form from '../../form'
import * as NumberFilter from '../filter-number'
import { NUMBER_OPERATORS, operatorIcon, type NumberOperator } from '../operator'
import { ioNumberPredicateOf } from '../predicate'
import { pretragaQuery } from '../query'

afterEach(unmount)

type Value = { readonly polje: NumberFilter.Form }

const draw = (
  value: NumberFilter.Form,
  changes: Array<Value> = [],
  decimals = 0,
  operators: NumberFilter.Operators = NUMBER_OPERATORS,
): void =>
  mount(
    Form.render({
      schema: Schema.Struct({ polje: NumberFilter.vForm(decimals, operators) }),
      value: { polje: value },
      onChange: next => changes.push(next),
      options: {
        template: locals => locals.inputs.polje as ReactNode,
        fields: { polje: { label: 'Predjena kilometraza' } },
      },
      issues: [],
      ctx: { disabled: false },
    }) as ReactNode,
  )

const trigger = (): HTMLButtonElement | null => document.querySelector('button')

const item = (operator: NumberOperator): Element | undefined => menuItems()[NUMBER_OPERATORS.indexOf(operator)]

describe('brojcano polje filtera', () => {
  it('prazno polje pokazuje prvi ponudjeni operator', () => {
    draw(null)

    expect(trigger()?.textContent).toBe(operatorIcon('eq'))
  })

  it('pokazuje operator koji je u vrednosti, ne prvi', () => {
    draw(['gte', '100'])

    expect(trigger()?.textContent).toBe(operatorIcon('gte'))
    expect(input().value).toBe('100')
  })

  it('jedan operator ne prikazuje meni', () => {
    draw(null, [], 0, ['gte'])

    expect(trigger()).toBeNull()
    expect(inputs()).toHaveLength(1)
  })

  it('polje je obicno tekstualno, bez strelica za uvecanje', () => {
    draw(['eq', '100'])

    expect(input().type).toBe('text')
    expect(input().getAttribute('step')).toBeNull()
  })

  it('kucanje zadrzava izabran operator', () => {
    const changes: Array<Value> = []
    draw(['lte', '10'], changes)

    otkucaj('100')

    expect(changes).toStrictEqual([{ polje: ['lte', '100'] }])
  })

  it('ne prima ono sto nije broj', () => {
    const changes: Array<Value> = []
    draw(['eq', ''], changes)

    otkucaj('abc')

    expect(changes).toStrictEqual([])
  })

  it('celobrojno polje ne prima decimalu, decimalno prima', () => {
    const uCeli: Array<Value> = []
    draw(['eq', ''], uCeli)
    otkucaj('4,2')
    unmount()

    const uDecimalno: Array<Value> = []
    draw(['eq', ''], uDecimalno, 2)
    otkucaj('4,2')

    expect(uCeli).toStrictEqual([])
    expect(uDecimalno).toStrictEqual([{ polje: ['eq', '4,2'] }])
  })

  it('labela pokazuje na polje za unos, ne na dugme operatora', () => {
    draw(null)

    expect(document.querySelector('label')?.getAttribute('for')).toBe(input().id)
  })
})

describe('between otvara drugi kraj', () => {
  it('jedan operator ima jedno polje, between dva', () => {
    draw(['gte', '100'])
    expect(inputs()).toHaveLength(1)
    unmount()

    draw(['between', '100', '200'])
    expect(inputs()).toHaveLength(2)
    expect(input(0).value).toBe('100')
    expect(input(1).value).toBe('200')
  })

  it('dva polja imaju razlicit id', () => {
    draw(['between', '100', '200'])

    expect(input(1).id).not.toBe(input(0).id)
  })

  it('kucanje u drugom kraju ne dira prvi', () => {
    const changes: Array<Value> = []
    draw(['between', '100', '200'], changes)

    otkucaj('250', 1)

    expect(changes).toStrictEqual([{ polje: ['between', '100', '250'] }])
  })

  it('prelazak na between zadrzava otkucano i otvara prazan drugi kraj', () => {
    const changes: Array<Value> = []
    draw(['eq', '100'], changes)

    click(trigger() ?? undefined)
    click(item('between'))

    expect(changes).toStrictEqual([{ polje: ['between', '100', ''] }])
  })

  it('povratak sa between zadrzava prvi kraj', () => {
    const changes: Array<Value> = []
    draw(['between', '100', '200'], changes)

    click(trigger() ?? undefined)
    click(item('lte'))

    expect(changes).toStrictEqual([{ polje: ['lte', '100'] }])
  })
})

describe('kriterijum', () => {
  it('prazno polje nije kriterijum', () => {
    expect(NumberFilter.toCriteria(null)).toBeUndefined()
    expect(NumberFilter.toCriteria(['eq', ''])).toBeUndefined()
    expect(NumberFilter.toCriteria(['eq', '   '])).toBeUndefined()
  })

  it('zapoceta vrednost nije kriterijum', () => {
    expect(NumberFilter.toCriteria(['eq', '-'])).toBeUndefined()
    expect(NumberFilter.toCriteria(['eq', '4,'])).toBeUndefined()
  })

  it('srpski zapis ide na zicu kao broj', () => {
    expect(NumberFilter.toCriteria(['gte', '12.000'])).toStrictEqual(['gte', '12000'])
    expect(NumberFilter.toCriteria(['lt', '1.234,5'])).toStrictEqual(['lt', '1234.5'])
    expect(NumberFilter.toCriteria(['eq', '-7'])).toStrictEqual(['eq', '-7'])
  })

  it('between spaja oba kraja u jedan zapis', () => {
    expect(NumberFilter.toCriteria(['between', '100', '200'])).toStrictEqual(['between', '100~200'])
  })

  it('between bez drugog kraja nije kriterijum', () => {
    expect(NumberFilter.toCriteria(['between', '100'])).toBeUndefined()
    expect(NumberFilter.toCriteria(['between', '100', ''])).toBeUndefined()
  })

  it('cita se nazad u zapis koji se prikazuje', () => {
    expect(NumberFilter.fromCriteria(['gte', '12000'])).toStrictEqual(['gte', '12.000'])
    expect(NumberFilter.fromCriteria(['lt', '1234.5'], 2)).toStrictEqual(['lt', '1.234,50'])
    expect(NumberFilter.fromCriteria(['between', '100~200'])).toStrictEqual(['between', '100', '200'])
    expect(NumberFilter.fromCriteria(undefined)).toBeNull()
  })

  it('tamo i nazad kroz zicu daje istu vrednost', () => {
    const polje: NumberFilter.Form = ['between', '1.234,50', '2.000,00']
    expect(NumberFilter.fromCriteria(NumberFilter.toCriteria(polje), 2)).toStrictEqual(polje)
  })
})

describe('ruta prima samo ono sto je predvidjeno', () => {
  const DOZVOLJENI: NumberFilter.Operators = ['gte', 'lte', 'between']

  const routes = Router.routes({
    proba: Router.path('/proba').query(
      pretragaQuery(
        Schema.Struct({ polje: Schema.optional(ioNumberPredicateOf(DOZVOLJENI)) }),
        Schema.Literal('polje'),
      ),
    ),
  })

  const parse = (search: string): string => {
    const found = Router.parse(routes, { pathname: '/proba', search })
    return Option.isNone(found) ? '404' : JSON.stringify(found.value.query)
  }

  it('dozvoljen operator prolazi kroz rutu', () => {
    expect(parse('?polje=gte&polje=100')).toBe('{"polje":["gte","100"]}')
    expect(parse('?polje=between&polje=100~200')).toBe('{"polje":["between","100~200"]}')
    expect(parse('?polje=lte&polje=-1234.5')).toBe('{"polje":["lte","-1234.5"]}')
  })

  it('nedozvoljen operator nema rutu', () => {
    expect(parse('?polje=eq&polje=100')).toBe('404')
    expect(parse('?polje=lajk&polje=100')).toBe('404')
  })

  it('vrednost koja nije broj nema rutu', () => {
    expect(parse('?polje=gte&polje=abc')).toBe('404')
    expect(parse('?polje=gte&polje=')).toBe('404')
    expect(parse('?polje=gte&polje=12.000,5')).toBe('404')
  })

  it('between bez oba kraja nema rutu', () => {
    expect(parse('?polje=between&polje=100')).toBe('404')
    expect(parse('?polje=between&polje=100~')).toBe('404')
    expect(parse('?polje=between&polje=100~200~300')).toBe('404')
  })

  it('meni nudi tacno ono sto ruter prima', () => {
    draw(null, [], 0, DOZVOLJENI)

    click(trigger() ?? undefined)

    expect(menuItems()).toHaveLength(DOZVOLJENI.length)
  })
})
