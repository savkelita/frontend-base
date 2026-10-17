// @vitest-environment happy-dom
import { Schema } from 'effect'
import { act, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { click, input, mount, unmount } from '../../../../testing/dom'
import { render } from '../../../form'
import { Data } from '../../../pretraga'
import * as Combo from '../../combo'

type Kategorija = { readonly id: number; readonly naziv: string }

const ioKategorija = Schema.Struct({ id: Schema.Number, naziv: Schema.String })

const prikaz = { id: (one: Kategorija) => one.id, render: (one: Kategorija) => one.naziv }

const B: Kategorija = { id: 2, naziv: 'B' }

const C: Kategorija = { id: 3, naziv: 'C' }

const ucitan = (open: boolean): Combo.Model<Kategorija> => ({
  ...Combo.empty<Kategorija>(),
  open,
  data: Data.Ready({ page: { rows: [B, C], total: 2 } }),
})

const draw = <V>(schema: Schema.Schema.Any, value: V, model: Combo.Model<Kategorija>): Array<string> => {
  const tags: Array<string> = []
  mount(
    render({
      schema: Schema.Struct({ kategorija: schema }),
      value: { kategorija: value },
      onChange: () => {},
      options: {
        template: locals => locals.inputs.kategorija as ReactNode,
        fields: {
          kategorija: { label: 'Kategorija', model, onMsg: (msg: Combo.Msg<Kategorija>) => void tags.push(msg._tag) },
        },
      },
    }) as ReactNode,
  )
  return tags
}

const option = (text: string): Element | undefined =>
  [...document.querySelectorAll('[role="option"], [role="menuitemcheckbox"]')].find(one => one.textContent === text)

const leave = (): void => {
  act(() => {
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  })
}

afterEach(unmount)

describe('combo sa jednim izborom', () => {
  const vKategorija = Combo.vForm(ioKategorija, prikaz)

  it('izbor stavke salje jedan Selected i jedan Closed', () => {
    const tags = draw(vKategorija, null, ucitan(true))

    click(option('B'))

    expect(tags).toStrictEqual(['Selected', 'Closed'])
  })

  it('odlazak iz polja sa zatvorenom listom ne salje nista', () => {
    const tags = draw(vKategorija, B, ucitan(false))

    leave()

    expect(tags).toStrictEqual([])
  })

  it('odlazak iz polja sa otvorenom listom je zatvara jednom', () => {
    const tags = draw(vKategorija, null, ucitan(true))

    leave()

    expect(tags).toStrictEqual(['Closed'])
  })
})

describe('combo sa vise izbora', () => {
  const vKategorije = Combo.vFormMulti(ioKategorija, prikaz)

  it('izbor stavke ne zatvara listu', () => {
    const tags = draw(vKategorije, [], ucitan(true))

    click(option('C'))

    expect(tags).toStrictEqual(['Selected'])
  })

  it('odlazak iz polja sa zatvorenom listom ne salje nista', () => {
    const tags = draw(vKategorije, [B], ucitan(false))

    leave()

    expect(tags).toStrictEqual([])
  })
})
