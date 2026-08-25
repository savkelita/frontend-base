import { SSRProvider } from '@fluentui/react-components'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../error'
import { Paging } from '../components/paging'
import { Data, next, type Data as DataType } from '../data'

const ready = (total: number): DataType<string> => Data.Ready({ page: { rows: ['a'], total } })

// Tooltip trazi stabilne id-eve, a bez provajdera ih na serveru nema.
const draw = (data: DataType<string>, offset = 0): string =>
  renderToStaticMarkup(
    createElement(SSRProvider, null, createElement(Paging<string>, { data, offset, limit: 10, onOffset: () => {} })),
  )

const ugasenih = (markup: string): number => (markup.match(/disabled=""/g) ?? []).length

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
    expect(ugasenih(draw(ready(42), 0))).toBe(2)
  })

  it('na poslednjoj strani nema napred', () => {
    expect(ugasenih(draw(ready(42), 40))).toBe(2)
  })

  it('prazan odgovor nema sta da lista', () => {
    expect(draw(ready(0))).toBe('')
  })

  // Jedna strana ne treba cetiri ugasena dugmeta — dovoljno je reci koliko ih ima.
  it('jedna strana nema kretanje', () => {
    const markup = draw(ready(7))
    expect(markup).toContain('1-7 od 7')
    expect(markup).not.toContain('Strana 1 od 1')
    expect(ugasenih(markup)).toBe(0)
  })

  // Nema odgovora, nema ni ukupnog broja — izlaz iz tog stanja je u tabeli.
  it('greska sklanja traku', () => {
    expect(draw(Data.Failed({ error: ApiError.NetworkError() }))).toBe('')
  })

  // Traka ostaje da se ne bi presipala visina ispod tabele, ali se ne moze kliknuti.
  it('dok stize sledeca strana traka stoji ugasena', () => {
    const markup = draw(next(ready(42)), 10)
    expect(markup).toContain('11-20 od 42')
    expect(ugasenih(markup)).toBe(4)
  })
})
