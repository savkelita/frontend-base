// @vitest-environment happy-dom
import { createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfirmDialog, FormDialog } from '../dialog'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let container: HTMLDivElement | undefined
let root: Root | undefined

const mount = (element: ReactNode): void => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root?.render(element)
  })
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  container?.remove()
  root = undefined
  container = undefined
})

const click = (label: string): void => {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent === label)
  if (button === undefined) throw new Error(`nema dugmeta "${label}", postoje: ${buttons().join(', ')}`)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

const buttons = (): ReadonlyArray<string> => [...document.querySelectorAll('button')].map(b => b.textContent ?? '')

const escape = (): void => {
  const surfaces = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')]
  const innermost = surfaces[surfaces.length - 1]
  if (innermost === undefined) throw new Error('nema otvorenog dijaloga')
  act(() => {
    innermost.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
}

const asks = (): boolean => document.body.textContent?.includes('Uneli ste izmene') === true

describe('ConfirmDialog', () => {
  it('escape odustaje', () => {
    const cancelled: Array<true> = []
    mount(
      createElement(ConfirmDialog, {
        title: 'Brisanje vozaca',
        confirmLabel: 'Obrisi',
        onConfirm: () => {},
        onCancel: () => cancelled.push(true),
        children: 'Da li ste sigurni?',
      }),
    )

    escape()

    expect(cancelled).toHaveLength(1)
  })

  it('escape ne odustaje dok traje slanje', () => {
    const cancelled: Array<true> = []
    mount(
      createElement(ConfirmDialog, {
        title: 'Brisanje vozaca',
        confirmLabel: 'Obrisi',
        isSubmitting: true,
        onConfirm: () => {},
        onCancel: () => cancelled.push(true),
        children: 'Da li ste sigurni?',
      }),
    )

    escape()

    expect(cancelled).toHaveLength(0)
  })
})

describe('FormDialog', () => {
  const open = (dirty: boolean, closed: Array<true>): void =>
    mount(
      createElement(FormDialog, {
        title: 'Izmena vozaca',
        submitLabel: 'Sacuvaj',
        isSubmitting: false,
        dirty,
        onSubmit: () => {},
        onClose: () => closed.push(true),
        children: 'polja',
      }),
    )

  it('odustajanje na nepromenjenoj formi zatvara bez pitanja', () => {
    const closed: Array<true> = []
    open(false, closed)

    click('Odustani')

    expect(asks()).toBe(false)
    expect(closed).toHaveLength(1)
  })

  it('odustajanje na promenjenoj formi pita umesto da zatvori', () => {
    const closed: Array<true> = []
    open(true, closed)

    click('Odustani')

    expect(asks()).toBe(true)
    expect(closed).toHaveLength(0)
  })

  it('escape na pitanju vraca na formu, ne zatvara dijalog', () => {
    const closed: Array<true> = []
    open(true, closed)
    click('Odustani')

    escape()

    expect(asks()).toBe(false)
    expect(closed).toHaveLength(0)
    expect(buttons()).toContain('Sacuvaj')
  })
})
