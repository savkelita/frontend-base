import { SSRProvider } from '@fluentui/react-components'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../error'
import { Paging } from '../components/paging'
import { Data, next, type Data as DataType } from '../data'

const ready = (total: number): DataType<string> => Data.Ready({ page: { rows: ['a'], total } })

const draw = (data: DataType<string>, offset = 0): string =>
  renderToStaticMarkup(
    createElement(SSRProvider, null, createElement(Paging<string>, { data, offset, limit: 10, onOffset: () => {} })),
  )

const disabled = (markup: string): number => (markup.match(/disabled=""/g) ?? []).length

describe('paging', () => {
  it('ispisuje opseg i stranu', () => {
    const markup = draw(ready(42), 10)
    expect(markup).toContain('11-20 od 42')
    expect(markup).toContain('Strana 2 od 5')
  })

  it('poslednji opseg ne prelazi ukupan broj', () => {
    expect(draw(ready(42), 40)).toContain('41-42 od 42')
  })

  it('na prvoj strani nema nazad', () => {
    expect(disabled(draw(ready(42), 0))).toBe(2)
  })

  it('na poslednjoj strani nema napred', () => {
    expect(disabled(draw(ready(42), 40))).toBe(2)
  })

  it('prazan odgovor nema sta da lista', () => {
    expect(draw(ready(0))).toBe('')
  })

  it('jedna strana nema kretanje', () => {
    const markup = draw(ready(7))
    expect(markup).toContain('1-7 od 7')
    expect(markup).not.toContain('Strana 1 od 1')
    expect(disabled(markup)).toBe(0)
  })

  it('greska sklanja traku', () => {
    expect(draw(Data.Failed({ error: ApiError.NetworkError() }))).toBe('')
  })

  it('dok stize sledeca strana traka stoji ugasena', () => {
    const markup = draw(next(ready(42)), 10)
    expect(markup).toContain('11-20 od 42')
    expect(disabled(markup)).toBe(4)
  })
})
