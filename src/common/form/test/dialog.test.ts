// @vitest-environment happy-dom
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { button, buttons, click, escape, mount, unmount } from '../../../testing/dom'
import { ConfirmDialog, FormDialog } from '../dialog'

afterEach(unmount)

const asks = (): boolean => document.body.textContent?.includes('Uneli ste izmene') === true

describe('ConfirmDialog', () => {
  const open = (isSubmitting: boolean, cancelled: Array<true>): void =>
    mount(
      createElement(ConfirmDialog, {
        title: 'Brisanje vozaca',
        confirmLabel: 'Obrisi',
        isSubmitting,
        onConfirm: () => {},
        onCancel: () => cancelled.push(true),
        children: 'Da li ste sigurni?',
      }),
    )

  it('escape odustaje', () => {
    const cancelled: Array<true> = []
    open(false, cancelled)

    escape()

    expect(cancelled).toHaveLength(1)
  })

  it('escape ne odustaje dok traje slanje', () => {
    const cancelled: Array<true> = []
    open(true, cancelled)

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

    click(button('Odustani'))

    expect(asks()).toBe(false)
    expect(closed).toHaveLength(1)
  })

  it('odustajanje na promenjenoj formi pita umesto da zatvori', () => {
    const closed: Array<true> = []
    open(true, closed)

    click(button('Odustani'))

    expect(asks()).toBe(true)
    expect(closed).toHaveLength(0)
  })

  it('escape na pitanju vraca na formu, ne zatvara dijalog', () => {
    const closed: Array<true> = []
    open(true, closed)
    click(button('Odustani'))

    escape()

    expect(asks()).toBe(false)
    expect(closed).toHaveLength(0)
    expect(buttons()).toContain('Sacuvaj')
  })
})
