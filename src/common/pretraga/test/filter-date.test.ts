import { describe, expect, it } from 'vitest'
import * as DateFilter from '../filter-date'

const day = (year: number, month: number, dayOfMonth: number): Date => new Date(year, month - 1, dayOfMonth)

describe('opseg bira operator sam', () => {
  it('oba kraja daju between', () => {
    expect(DateFilter.fromEnds([day(2026, 1, 15), day(2026, 2, 20)])).toStrictEqual([
      'between',
      day(2026, 1, 15),
      day(2026, 2, 20),
    ])
  })

  it('samo od daje granicu od tog dana nadalje', () => {
    expect(DateFilter.fromEnds([day(2026, 1, 15), null])).toStrictEqual(['after_or_same', day(2026, 1, 15)])
  })

  it('samo do daje granicu zakljucno sa tim danom', () => {
    expect(DateFilter.fromEnds([null, day(2026, 2, 20)])).toStrictEqual(['before_or_same', day(2026, 2, 20)])
  })

  it('prazan opseg nije kriterijum', () => {
    expect(DateFilter.fromEnds([null, null])).toBeNull()
  })
})

describe('datumi se vracaju u polja iz kojih su dosli', () => {
  it('before_or_same ide u drugo polje, ne u prvo', () => {
    expect(DateFilter.ends(['before_or_same', day(2026, 2, 20)])).toStrictEqual([null, day(2026, 2, 20)])
  })

  it('after_or_same ide u prvo polje', () => {
    expect(DateFilter.ends(['after_or_same', day(2026, 1, 15)])).toStrictEqual([day(2026, 1, 15), null])
  })

  it('tamo i nazad daje istu stvar', () => {
    const bounds: readonly [Date | null, Date | null] = [null, day(2026, 2, 20)]
    expect(DateFilter.ends(DateFilter.fromEnds(bounds))).toStrictEqual(bounds)
  })
})

describe('kriterijum', () => {
  it('datum ide kao YYYY-MM-DD', () => {
    expect(DateFilter.toCriteria(['after_or_same', day(2026, 1, 15)])).toStrictEqual(['after_or_same', '2026-01-15'])
  })

  it('between spaja oba kraja u jedan string', () => {
    expect(DateFilter.toCriteria(['between', day(2026, 1, 15), day(2026, 2, 20)])).toStrictEqual([
      'between',
      '2026-01-15~2026-02-20',
    ])
  })

  it('between bez drugog kraja nije kriterijum', () => {
    expect(DateFilter.toCriteria(['between', day(2026, 1, 15)])).toBeUndefined()
  })

  it('prazno polje nije kriterijum', () => {
    expect(DateFilter.toCriteria(null)).toBeUndefined()
  })

  it('cita se nazad sa operatorom iz adrese', () => {
    expect(DateFilter.fromCriteria(['before', '2026-01-15'])).toStrictEqual(['before', day(2026, 1, 15)])
    expect(DateFilter.fromCriteria(['between', '2026-01-15~2026-02-20'])).toStrictEqual([
      'between',
      day(2026, 1, 15),
      day(2026, 2, 20),
    ])
    expect(DateFilter.fromCriteria(undefined)).toBeNull()
  })

  it('tamo i nazad kroz zicu daje istu vrednost', () => {
    const field: DateFilter.Form = ['between', day(2026, 1, 15), day(2026, 2, 20)]
    expect(DateFilter.fromCriteria(DateFilter.toCriteria(field))).toStrictEqual(field)
  })
})
