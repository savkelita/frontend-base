import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApiError, reportError, type ServerError } from '../index'
import { ErrorView } from '../view'

const business = (message: string, severity: 'ERROR' | 'WARNING'): ServerError => ({
  type: 'BUSINESS',
  code: 'PP001',
  messageCode: 'ERR',
  message,
  severity,
})

const draw = (error: ApiError): string => renderToStaticMarkup(createElement(ErrorView, { report: reportError(error) }))

describe('prikaz izvestaja', () => {
  it('ispisuje svaku poruku iz liste', () => {
    const markup = draw(ApiError.BadRequest({ errors: [business('Prva', 'ERROR'), business('Druga', 'ERROR')] }))
    expect(markup).toContain('Prva')
    expect(markup).toContain('Druga')
  })

  it('svaka poruka stoji u svom bloku, da se dve ne stope u jedan red', () => {
    const markup = draw(ApiError.BadRequest({ errors: [business('Prva', 'ERROR'), business('Druga', 'ERROR')] }))
    expect(markup).not.toContain('PrvaDruga')
  })

  // Izlaz iz greske ide u traku, ne pored nje — MessageBar za to ima svoje mesto.
  it('akcija stoji unutar trake, uz poruku', () => {
    const markup = renderToStaticMarkup(
      createElement(ErrorView, { report: reportError(ApiError.NetworkError()), actions: 'AKCIJA' }),
    )
    expect(markup).toContain('AKCIJA')
    expect(markup).toContain('fui-MessageBarActions')
  })

  it('bez akcije nema praznog mesta za nju', () => {
    expect(draw(ApiError.NetworkError())).not.toContain('fui-MessageBarActions')
  })

  it('upozorenje se u prikazu razlikuje od greske', () => {
    const greska = draw(ApiError.BadRequest({ errors: [business('Ista', 'ERROR')] }))
    const upozorenje = draw(ApiError.BadRequest({ errors: [business('Ista', 'WARNING')] }))
    expect(upozorenje).not.toBe(greska)
    expect(greska).toBe(draw(ApiError.BadRequest({ errors: [business('Ista', 'ERROR')] })))
  })
})
