import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FilterDrawer } from '../components/filter-drawer'
import { PretragaLayout, type PretragaLayoutProps } from '../components/layout'

const draw = (props: Partial<PretragaLayoutProps> = {}): string =>
  renderToStaticMarkup(
    createElement(PretragaLayout, {
      title: 'Vozaci',
      table: 'TABELA',
      paging: 'PAGING',
      ...props,
    }),
  )

describe('okvir pretrage', () => {
  it('ispisuje naslov, tabelu i paging', () => {
    const markup = draw()
    expect(markup).toContain('Vozaci')
    expect(markup).toContain('TABELA')
    expect(markup).toContain('PAGING')
  })

  it('bez filtera i akcija crta samo tabelu', () => {
    const markup = draw()
    expect(markup).not.toContain('FILTER')
    expect(markup).not.toContain('AKCIJE')
  })

  it('filter stoji pored tabele, ne umesto nje', () => {
    const markup = draw({ filter: 'FILTER' })
    expect(markup.indexOf('TABELA')).toBeLessThan(markup.indexOf('FILTER'))
  })

  it('akcije stoje uz naslov, pre tabele', () => {
    const markup = draw({ actions: 'AKCIJE' })
    expect(markup.indexOf('AKCIJE')).toBeLessThan(markup.indexOf('TABELA'))
  })

  // Neuspeh pretrage je stanje podataka, pa ga crta tabela; okvir o njemu ne zna nista.
  it('okvir ne crta greske', () => {
    expect(draw()).not.toContain('MessageBar')
  })
})

describe('filter u fioci', () => {
  const drawer = (open: boolean): string =>
    renderToStaticMarkup(
      createElement(FilterDrawer, {
        open,
        onClose: () => {},
        onSubmit: () => {},
        onClear: () => {},
        children: 'POLJA',
      }),
    )

  it('otvorena fioka pokazuje polja i obe radnje', () => {
    const markup = drawer(true)
    expect(markup).toContain('POLJA')
    expect(markup).toContain('Pretrazi')
    expect(markup).toContain('Ponisti')
  })

  it('zatvorena fioka ne zauzima prostor', () => {
    expect(drawer(false)).not.toContain('POLJA')
  })
})
