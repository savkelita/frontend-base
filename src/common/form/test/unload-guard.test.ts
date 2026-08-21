// @vitest-environment happy-dom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { UnloadGuard } from '../unload-guard'

const globals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }

globals.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined

const draw = (active: boolean): void => {
  act(() => {
    if (root === undefined) root = createRoot(document.createElement('div'))
    root.render(createElement(UnloadGuard, { active }))
  })
}

const napustaSe = (): boolean => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return !event.defaultPrevented
}

afterEach(() => {
  act(() => root?.unmount())
  root = undefined
})

describe('cuvar odlaska sa strane', () => {
  it('bez izmena odlazak prolazi', () => {
    draw(false)
    expect(napustaSe()).toBe(true)
  })

  it('sa izmenama odlazak trazi potvrdu', () => {
    draw(true)
    expect(napustaSe()).toBe(false)
  })

  it('prati stanje forme u oba smera', () => {
    draw(true)
    expect(napustaSe()).toBe(false)
    draw(false)
    expect(napustaSe()).toBe(true)
    draw(true)
    expect(napustaSe()).toBe(false)
  })

  // Bez ovoga bi zatvoren dijalog nastavio da zaustavlja odlazak sa strane.
  it('gasenjem dijaloga osluskivac nestaje', () => {
    draw(true)
    act(() => root?.unmount())
    root = undefined
    expect(napustaSe()).toBe(true)
  })
})
