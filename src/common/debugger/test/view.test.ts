import { Data, Option } from 'effect'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type * as Platform from 'tea-effect/Platform'
import { describe, expect, it } from 'vitest'
import { app, view, type Model, type Msg } from '../index'

type Counted = Data.TaggedEnum<{ Clicked: {} }>

const Counted = Data.taggedEnum<Counted>()

const draw = (model: Model<number, Counted>) => {
  const received: Array<Platform.Dispatch<Counted>> = []
  const sent: Array<Msg<number, Counted>> = []
  const appView = (count: number) => (dispatch: Platform.Dispatch<Counted>) => {
    received.push(dispatch)
    return createElement('span', null, `broj ${count}`)
  }
  const markup = renderToStaticMarkup(view(appView)(model)(msg => void sent.push(msg)))
  return { markup, click: () => received[0]?.(Counted.Clicked()), sent }
}

describe('prikaz uz DevTools', () => {
  it('zivo stanje se crta, a klik ide u aplikaciju', () => {
    const screen = draw({ app: 1, last: Option.none(), shown: Option.none(), queue: [] })

    screen.click()

    expect(screen.markup).toBe('<span>broj 1</span>')
    expect(screen.sent).toStrictEqual([app(Counted.Clicked())])
  })

  it('staro stanje se crta, a klik ne radi nista', () => {
    const screen = draw({ app: 1, last: Option.none(), shown: Option.some(7), queue: [] })

    screen.click()

    expect(screen.markup).toBe('<span>broj 7</span>')
    expect(screen.sent).toStrictEqual([])
  })
})
