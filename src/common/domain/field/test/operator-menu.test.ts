// @vitest-environment happy-dom
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { click, menuItems, menuLabels, mount, unmount } from '../../../../testing/dom'
import { operatorIcon, type Operator } from '../../../pretraga/operator'
import { OperatorMenu } from '../operator-menu'

afterEach(unmount)

const draw = (
  operators: ReadonlyArray<Operator>,
  value: Operator,
  chosen: Array<Operator> = [],
  disabled = false,
): void => mount(createElement(OperatorMenu, { operators, value, disabled, onChange: one => chosen.push(one) }))

const trigger = (): HTMLButtonElement => {
  const found = document.querySelector('button')
  if (found === null) throw new Error('nema dugmeta za operator')
  return found
}

describe('meni operatora', () => {
  it('dugme nosi znak izabranog operatora, a naziv ide citacu ekrana', () => {
    draw(['contains', 'starts_with'], 'contains')

    expect(trigger().textContent).toBe(operatorIcon('contains'))
    expect(trigger().getAttribute('aria-label')).toBe('Operator: Sadrzi')
    expect(trigger().getAttribute('title')).toBe('Sadrzi')
  })

  it('dugme nosi strelicu, jer je ona jedini znak da se otvara meni', () => {
    draw(['contains', 'starts_with'], 'contains')

    expect(trigger().querySelectorAll('svg')).toHaveLength(1)
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
  })

  it('meni nudi tacno zadate operatore, znakom i nazivom', () => {
    draw(['contains', 'starts_with', 'eq'], 'contains')

    click(trigger())

    expect(menuLabels()).toStrictEqual([
      `${operatorIcon('contains')}   Sadrzi`,
      `${operatorIcon('starts_with')}   Pocinje sa`,
      `${operatorIcon('eq')}   Jednako`,
    ])
  })

  it('izabran operator je obelezen, ostali nisu', () => {
    draw(['contains', 'starts_with'], 'starts_with')

    click(trigger())

    expect(menuItems().map(one => one.getAttribute('aria-checked'))).toStrictEqual(['false', 'true'])
  })

  it('izbor javlja operator, ne indeks', () => {
    const chosen: Array<Operator> = []
    draw(['contains', 'starts_with', 'eq'], 'contains', chosen)

    click(trigger())
    click(menuItems()[2])

    expect(chosen).toStrictEqual(['eq'])
  })

  it('ugasen meni se ne otvara', () => {
    draw(['contains', 'starts_with'], 'contains', [], true)

    click(trigger())

    expect(menuLabels()).toStrictEqual([])
  })
})
