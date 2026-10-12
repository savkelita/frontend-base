import { Order } from 'effect'
import { describe, expect, it } from 'vitest'
import { byDate, byNumber, byText, sortRows, toOrder, type ColumnOrder, type SortableColumn } from '../sort'

type Red = { readonly ime: string; readonly broj: number | null; readonly datum: Date | null }

const red = (ime: string, broj: number | null = null, datum: Date | null = null): Red => ({ ime, broj, datum })

const COLUMNS: ReadonlyArray<SortableColumn<Red>> = [
  { id: 'ime', order: byText(row => row.ime) },
  { id: 'broj', order: byNumber(row => row.broj) },
  { id: 'datum', order: byDate(row => row.datum) },
  { id: 'bezSortiranja' },
]

const imena = (rows: ReadonlyArray<Red>): ReadonlyArray<string> => rows.map(row => row.ime)

describe('redosled bez servera', () => {
  const rows = [red('Mika'), red('Ana'), red('Zoran')]

  it('bez sortiranja ostaje kako je stiglo', () => {
    expect(sortRows(rows, null, COLUMNS)).toBe(rows)
  })

  it('kolona koja ne zna da poredi ne menja redosled', () => {
    expect(sortRows(rows, { attribute: 'bezSortiranja', direction: 'ASC' }, COLUMNS)).toBe(rows)
  })

  it('nepoznata kolona ne menja redosled', () => {
    expect(sortRows(rows, { attribute: 'nepostojeca', direction: 'ASC' }, COLUMNS)).toBe(rows)
  })

  it('rastuce i opadajuce po tekstu', () => {
    expect(imena(sortRows(rows, { attribute: 'ime', direction: 'ASC' }, COLUMNS))).toStrictEqual([
      'Ana',
      'Mika',
      'Zoran',
    ])
    expect(imena(sortRows(rows, { attribute: 'ime', direction: 'DESC' }, COLUMNS))).toStrictEqual([
      'Zoran',
      'Mika',
      'Ana',
    ])
  })

  it('ne dira ulazni niz', () => {
    const original = [...rows]
    sortRows(rows, { attribute: 'ime', direction: 'ASC' }, COLUMNS)
    expect(rows).toStrictEqual(original)
  })

  it('brojevi se porede kao brojevi, ne kao tekst', () => {
    const brojevi = [red('a', 10), red('b', 9), red('c', 100)]
    expect(imena(sortRows(brojevi, { attribute: 'broj', direction: 'ASC' }, COLUMNS))).toStrictEqual(['b', 'a', 'c'])
  })

  it('datumi se porede po trenutku', () => {
    const datumi = [red('a', null, new Date(2026, 5, 1)), red('b', null, new Date(2026, 0, 1))]
    expect(imena(sortRows(datumi, { attribute: 'datum', direction: 'ASC' }, COLUMNS))).toStrictEqual(['b', 'a'])
  })

  it('prazne vrednosti idu na kraj u oba smera', () => {
    const saPraznim = [red('a', null), red('b', 2), red('c', 1)]
    expect(imena(sortRows(saPraznim, { attribute: 'broj', direction: 'ASC' }, COLUMNS))).toStrictEqual(['c', 'b', 'a'])
    expect(imena(sortRows(saPraznim, { attribute: 'broj', direction: 'DESC' }, COLUMNS))).toStrictEqual(['b', 'c', 'a'])
  })

  it('jednake vrednosti zadrzavaju zatecen redosled', () => {
    const isti = [red('prvi', 1), red('drugi', 1), red('treci', 1)]
    expect(imena(sortRows(isti, { attribute: 'broj', direction: 'DESC' }, COLUMNS))).toStrictEqual([
      'prvi',
      'drugi',
      'treci',
    ])
  })
})

describe('redosled za server', () => {
  it('prazan sort ne salje nista', () => {
    expect(toOrder(null)).toStrictEqual([])
  })

  it('popunjen sort salje jedan par', () => {
    expect(toOrder({ attribute: 'ime', direction: 'DESC' })).toStrictEqual([['ime', 'DESC']])
  })
})

describe('kompozicija', () => {
  const poBrojuPaImenu: ColumnOrder<Red> = {
    blank: () => false,
    value: Order.combine(byNumber<Red>(row => row.broj).value, byText<Red>(row => row.ime).value),
  }

  it('dva kljuca se spajaju, drugi razresava izjednacene', () => {
    const rows = [red('Zoran', 1), red('Ana', 1), red('Mika', 0)]
    const columns: ReadonlyArray<SortableColumn<Red>> = [{ id: 'slozeno', order: poBrojuPaImenu }]
    expect(imena(sortRows(rows, { attribute: 'slozeno', direction: 'ASC' }, columns))).toStrictEqual([
      'Mika',
      'Ana',
      'Zoran',
    ])
  })
})

describe('srpska azbuka i abeceda', () => {
  const po = (ime: string): Red => red(ime)
  const poredjani = (imena: ReadonlyArray<string>): ReadonlyArray<string> =>
    sortRows(imena.map(po), { attribute: 'ime', direction: 'ASC' }, COLUMNS).map(row => row.ime)

  it('okruzenje ima srpsku kolaciju', () => {
    expect(Intl.Collator.supportedLocalesOf(['sr-Latn'])).toStrictEqual(['sr-Latn'])
  })

  it('latinica: C, C-kvacica i C-crtica su tri slova, ne jedno sa znakom', () => {
    expect(poredjani(['Ćiric', 'Cvetic', 'Čolic'])).toStrictEqual(['Cvetic', 'Čolic', 'Ćiric'])
  })

  it('latinica: Z i Z-kvacica se ne mesaju', () => {
    expect(poredjani(['Žikic', 'Zoran'])).toStrictEqual(['Zoran', 'Žikic'])
  })

  it('latinica: D-crtica ide posle D', () => {
    expect(poredjani(['Đordevic', 'Dzamija'])).toStrictEqual(['Dzamija', 'Đordevic'])
  })

  it('cirilica: slova van ruskog niza ne padaju ispred A', () => {
    expect(poredjani(['Шешељ', 'Ђорђевић', 'Ана', 'Јовић', 'Ћирић', 'Џамија'])).toStrictEqual([
      'Ана',
      'Ђорђевић',
      'Јовић',
      'Ћирић',
      'Џамија',
      'Шешељ',
    ])
  })

  it('poredjenje po kodnim tackama bi oba pisma poredjalo pogresno', () => {
    expect(['Ćiric', 'Cvetic', 'Čolic'].toSorted()).not.toStrictEqual(['Cvetic', 'Čolic', 'Ćiric'])
    expect(['Ђорђевић', 'Ана'].toSorted()).not.toStrictEqual(['Ана', 'Ђорђевић'])
  })
})
