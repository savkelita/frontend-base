import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let container: HTMLDivElement | undefined
let root: Root | undefined

export const mount = (element: ReactNode): void => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root?.render(element)
  })
}

export const unmount = (): void => {
  act(() => {
    root?.unmount()
  })
  container?.remove()
  root = undefined
  container = undefined
}

export const buttons = (): ReadonlyArray<string> =>
  [...document.querySelectorAll('button')].map(one => one.textContent ?? '')

export const button = (label: string): HTMLButtonElement => {
  const found = [...document.querySelectorAll('button')].find(one => one.textContent === label)
  if (found === undefined) throw new Error(`nema dugmeta "${label}", postoje: ${buttons().join(', ')}`)
  return found
}

export const click = (element: Element | undefined): void => {
  if (element === undefined) throw new Error('nema elementa na koji bi se kliknulo')
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

export const escape = (): void => {
  const surfaces = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')]
  const innermost = surfaces[surfaces.length - 1]
  if (innermost === undefined) throw new Error('nema otvorenog dijaloga')
  act(() => {
    innermost.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
}

export const inputs = (): ReadonlyArray<HTMLInputElement> => [...document.querySelectorAll('input')]

export const input = (index = 0): HTMLInputElement => {
  const found = inputs()[index]
  if (found === undefined) throw new Error(`nema polja za unos pod rednim brojem ${index}`)
  return found
}

export const type = (text: string, index = 0): void => {
  const field = input(index)
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  act(() => {
    setter?.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export const menuItems = (): ReadonlyArray<Element> => [...document.querySelectorAll('[role="menuitemradio"]')]

export const menuLabels = (): ReadonlyArray<string> => menuItems().map(one => one.textContent ?? '')
