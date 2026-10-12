// @vitest-environment happy-dom
import { Option, Schema } from 'effect'
import type { ReactNode } from 'react'
import * as Router from 'tea-effect/Router'
import { afterEach, describe, expect, it } from 'vitest'
import { click, menuItems, mount, unmount } from '../../../testing/dom'
import * as Form from '../../form'
import * as EnumFilter from '../filter-enum'
import { operatorIcon } from '../operator'
import { ioEnumPredicateOf } from '../predicate'
import { pretragaQuery } from '../query'

const KEYS = { AKTIVAN: 'Aktivan', PASIVAN: 'Pasivan' }

type Stanje = keyof typeof KEYS

afterEach(unmount)

type Value = { readonly polje: EnumFilter.Form<Stanje> }

const draw = (operators: EnumFilter.Operators, value: EnumFilter.Form<Stanje>, changes: Array<Value> = []): void =>
  mount(
    Form.render({
      schema: Schema.Struct({ polje: EnumFilter.vForm(KEYS, operators) }),
      value: { polje: value },
      onChange: next => changes.push(next),
      options: { template: locals => locals.inputs.polje as ReactNode, fields: { polje: { label: 'Stanje' } } },
      issues: [],
      ctx: { disabled: false },
    }) as ReactNode,
  )

const trigger = (): HTMLButtonElement | null => document.querySelector('[aria-haspopup="menu"]')

const dropdown = (): Element => {
  const found = document.querySelector('[role="combobox"]')
  if (found === null) throw new Error('nema padajuceg menija')
  return found
}

const optionRoles = (): ReadonlyArray<string | null> =>
  [...document.querySelectorAll('[role="option"], [role="menuitemcheckbox"]')].map(one => one.getAttribute('role'))

describe('enum polje filtera', () => {
  const SVE: EnumFilter.Operators = ['eq', 'neq', 'in']

  it('meni nudi i IN pored jednako', () => {
    draw(SVE, null)

    click(trigger() ?? undefined)

    expect(menuItems().map(one => one.textContent)).toStrictEqual([
      `${operatorIcon('eq')}   Jednako`,
      `${operatorIcon('neq')}   Nije jednako`,
      `${operatorIcon('in')}   Jedno od`,
    ])
  })

  it('eq daje izbor jedne vrednosti', () => {
    draw(SVE, ['eq', 'AKTIVAN'])

    click(dropdown())

    expect(optionRoles()).toStrictEqual(['option', 'option'])
  })

  it('IN pretvara isto polje u multiselect', () => {
    draw(SVE, ['in', 'AKTIVAN'])

    click(dropdown())

    expect(optionRoles()).toStrictEqual(['menuitemcheckbox', 'menuitemcheckbox'])
  })

  it('prelazak na IN zadrzava izabranu vrednost', () => {
    const changes: Array<Value> = []
    draw(SVE, ['eq', 'PASIVAN'], changes)

    click(trigger() ?? undefined)
    click(menuItems()[2])

    expect(changes).toStrictEqual([{ polje: ['in', 'PASIVAN'] }])
  })

  it('izlazak iz IN zadrzava prvu vrednost, ostale odbacuje', () => {
    const changes: Array<Value> = []
    draw(SVE, ['in', 'AKTIVAN', 'PASIVAN'], changes)

    click(trigger() ?? undefined)
    click(menuItems()[0])

    expect(changes).toStrictEqual([{ polje: ['eq', 'AKTIVAN'] }])
  })

  it('jedan operator ne prikazuje meni', () => {
    draw(['eq'], null)

    expect(trigger()).toBeNull()
  })
})

describe('toCriteria', () => {
  it('bez izabrane vrednosti nema kriterijuma', () => {
    expect(EnumFilter.toCriteria(null)).toBeUndefined()
    expect(EnumFilter.toCriteria<Stanje>(['eq'])).toBeUndefined()
  })

  it('eq salje samo prvu vrednost', () => {
    expect(EnumFilter.toCriteria<Stanje>(['eq', 'AKTIVAN'])).toStrictEqual(['eq', 'AKTIVAN'])
  })

  it('IN salje sve izabrane', () => {
    expect(EnumFilter.toCriteria<Stanje>(['in', 'AKTIVAN', 'PASIVAN'])).toStrictEqual(['in', 'AKTIVAN', 'PASIVAN'])
  })
})

describe('suzen skup operatora', () => {
  const DOZVOLJENI: EnumFilter.Operators = ['eq', 'in']

  const routes = Router.routes({
    proba: Router.path('/proba').query(
      pretragaQuery(
        Schema.Struct({
          polje: Schema.optional(ioEnumPredicateOf(Schema.Literal('AKTIVAN', 'PASIVAN'), DOZVOLJENI)),
        }),
        Schema.Literal('polje'),
      ),
    ),
  })

  const parse = (search: string): string => {
    const found = Router.parse(routes, { pathname: '/proba', search })
    return Option.isNone(found) ? '404' : JSON.stringify(found.value.query)
  }

  it('IN nosi vise vrednosti kroz adresu', () => {
    expect(parse('?polje=in&polje=AKTIVAN&polje=PASIVAN')).toBe('{"polje":["in","AKTIVAN","PASIVAN"]}')
  })

  it('nedozvoljen operator nema rutu', () => {
    expect(parse('?polje=neq&polje=AKTIVAN')).toBe('404')
  })

  it('nepostojeca vrednost nema rutu', () => {
    expect(parse('?polje=eq&polje=MARKO')).toBe('404')
  })
})
