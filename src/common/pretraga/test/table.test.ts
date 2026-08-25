import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../error'
import { Table, type Column } from '../components/table'
import { Data } from '../data'

type Row = { readonly id: number; readonly naziv: string; readonly broj: number }

const ROWS: ReadonlyArray<Row> = [
  { id: 1, naziv: 'Prvi', broj: 10 },
  { id: 2, naziv: 'Drugi', broj: 20 },
]

const COLUMNS: ReadonlyArray<Column<Row>> = [
  { id: 'naziv', header: 'Naziv', attribute: 'naziv', render: row => row.naziv },
  { id: 'broj', header: 'Broj', render: row => `${row.broj} kom` },
]

const ready = (rows: ReadonlyArray<Row> = ROWS): Data<Row> => Data.Ready({ page: { rows, total: rows.length } })

const draw = (props: Partial<Parameters<typeof Table<Row>>[0]> = {}): string =>
  renderToStaticMarkup(
    createElement(Table<Row>, {
      columns: COLUMNS,
      data: ready(),
      rowId: row => row.id,
      selected: [],
      onSelect: () => {},
      onRetry: () => {},
      sort: null,
      onSort: () => {},
      ...props,
    }),
  )

describe('table', () => {
  it('ispisuje zaglavlja i redove', () => {
    const markup = draw()
    expect(markup).toContain('Naziv')
    expect(markup).toContain('Prvi')
    expect(markup).toContain('Drugi')
  })

  it('celija prikazuje ono sto `render` vrati', () => {
    expect(draw()).toContain('10 kom')
  })

  /**
   * `DataGridRow` crta povratnu vrednost DIREKTNO, bez omotaca. Zato se celija omotava u
   * redu — inace nema `fui-DataGridCell`, a s njim ni uloga, ni sortiranja, ni sirine.
   *
   * Broji se bas ta klasa: `role="gridcell"` postoji i bez omotaca, jer ga daje celija
   * za selekciju, pa bi provera po ulozi bila prazna.
   */
  it('svaka celija je prava celija mreze', () => {
    const markup = draw()
    expect(markup.match(/fui-DataGridCell/g) ?? []).toHaveLength(ROWS.length * COLUMNS.length)
    expect(markup).toContain('role="columnheader"')
  })

  // Kolona bez `attribute` ne sme da bude klikabilna — server po njoj ne ume da sortira.
  it('samo kolona sa `attribute` prijavljuje sortiranje', () => {
    expect(draw().match(/aria-sort/g) ?? []).toHaveLength(1)
  })

  it('prvo ucitavanje daje spinner', () => {
    const markup = draw({ data: Data.Loading({ previous: null }) })
    expect(markup).toContain('Preuzimam podatke')
    expect(markup).not.toContain('Nema rezultata')
  })

  it('prazan odgovor daje poruku, ne spinner', () => {
    const markup = draw({ data: ready([]) })
    expect(markup).toContain('Nema rezultata')
    expect(markup).not.toContain('Preuzimam podatke')
  })

  it('dok stize sledeca strana zatecena tabela ostaje, ali pod spinnerom', () => {
    const markup = draw({ data: Data.Loading({ previous: { rows: ROWS, total: 500 } }) })
    expect(markup).toContain('Prvi')
    expect(markup).toContain('Preuzimam podatke')
  })

  // Klik kroz spinner bi uneo red sa strane koja se upravo menja.
  it('ucitavanje javlja zauzetost', () => {
    expect(draw({ data: Data.Loading({ previous: null }) })).toContain('aria-busy="true"')
    expect(draw()).toContain('aria-busy="false"')
  })

  // Poruka o praznom skupu je odgovor servera; kad odgovora nema, tabela ne tvrdi nista.
  it('greska ne tvrdi da nema rezultata', () => {
    const markup = draw({ data: Data.Failed({ error: ApiError.ServerFailure() }) })
    expect(markup).not.toContain('Nema rezultata')
    expect(markup).not.toContain('Preuzimam podatke')
    expect(markup).toContain('Naziv')
  })

  // Sva cetiri stanja podataka stoje na istom mestu — tu gde bi bili i redovi.
  it('greska se ispisuje kroz reportError, uz izlaz iz stanja', () => {
    const markup = draw({ data: Data.Failed({ error: ApiError.NetworkError() }) })
    expect(markup).toContain('Desio se problem u komunikaciji sa serverom. Proverite vezu.')
    expect(markup).toContain('Pokusaj ponovo')
  })

  it('bez greske nema ponovnog pokusaja', () => {
    expect(draw()).not.toContain('Pokusaj ponovo')
    expect(draw({ data: ready([]) })).not.toContain('Pokusaj ponovo')
  })
})

describe('sirina kolona', () => {
  it('svaka kolona ima ruckicu za promenu sirine', () => {
    const markup = draw()
    expect(markup.match(/fui-TableResizeHandle/g) ?? []).toHaveLength(COLUMNS.length)
  })

  // Kolona bez `width` se i dalje hvata — sirina je pocetna vrednost, ne uslov.
  it('kolona bez zadate sirine takodje ima ruckicu', () => {
    const markup = draw({ columns: [{ id: 'naziv', header: 'Naziv', render: row => row.naziv }] })
    expect(markup).toContain('fui-TableResizeHandle')
  })

  it('zadata sirina je pocetna sirina kolone', () => {
    const markup = draw({ columns: [{ id: 'naziv', header: 'Naziv', width: 60, render: row => row.naziv }] })
    expect(markup).toContain('aria-valuetext="60 pixels"')
  })

  it('ruckica ima pristupacno ime', () => {
    expect(draw()).toContain('aria-label="Resize column"')
  })
})
