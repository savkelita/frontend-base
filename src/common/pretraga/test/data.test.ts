import { describe, expect, it } from 'vitest'
import { ApiError } from '../../error'
import { Data, initial, isLoading, next, rows, total, type Page } from '../data'

const page: Page<string> = { rows: ['a', 'b'], total: 42 }

describe('data', () => {
  it('pocinje u ucitavanju, bez redova i bez ukupnog broja', () => {
    const data = initial<string>()
    expect(isLoading(data)).toBe(true)
    expect(rows(data)).toStrictEqual([])
    expect(total(data)).toBe(0)
  })

  it('strana daje redove i ukupan broj', () => {
    const data = Data.Ready({ page })
    expect(rows(data)).toStrictEqual(['a', 'b'])
    expect(total(data)).toBe(42)
    expect(isLoading(data)).toBe(false)
  })

  // Bez ovoga tabela na svaku sledecu stranu zatreperi u prazno.
  it('sledeci zahtev zadrzava zatecenu stranu dok stize odgovor', () => {
    const data = next(Data.Ready({ page }))
    expect(isLoading(data)).toBe(true)
    expect(rows(data)).toStrictEqual(['a', 'b'])
    expect(total(data)).toBe(42)
  })

  it('greska prazni tabelu', () => {
    const data = Data.Failed<string>({ error: ApiError.ServerFailure() })
    expect(rows(data)).toStrictEqual([])
    expect(total(data)).toBe(0)
    expect(isLoading(data)).toBe(false)
  })

  it('posle greske nema sta da se zadrzi', () => {
    expect(rows(next(Data.Failed<string>({ error: ApiError.ServerFailure() })))).toStrictEqual([])
  })
})
