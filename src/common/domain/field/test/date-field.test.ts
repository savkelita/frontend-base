import { DayOfWeek } from '@fluentui/react-calendar-compat'
import { describe, expect, it } from 'vitest'
import { calendar } from '../date-field'

const { strings } = calendar

const allStrings: ReadonlyArray<string> = Object.values(strings).flatMap(value =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? value : [],
)

describe('lokalizacija kalendara', () => {
  it('meseci i dani imaju tacno onoliko clanova koliko se indeksira', () => {
    expect(strings.months).toHaveLength(12)
    expect(strings.shortMonths).toHaveLength(12)
    expect(strings.days).toHaveLength(7)
    expect(strings.shortDays).toHaveLength(7)
  })

  it('dani pocinju od nedelje jer to trazi getDay()', () => {
    expect(strings.days[0]).toBe('Nedelja')
    expect(strings.days[1]).toBe('Ponedeljak')
    expect(strings.days[6]).toBe('Subota')
  })

  it('meseci pocinju od januara', () => {
    expect(strings.months[0]).toBe('Januar')
    expect(strings.months[11]).toBe('Decembar')
  })

  it('nedelja prelazi na kraj, ponedeljak je prvi', () => {
    expect(calendar.firstDayOfWeek).toBe(DayOfWeek.Monday)
  })

  it('skracenice dana se ne ponavljaju', () => {
    expect(new Set(strings.shortDays).size).toBe(7)
  })

  it('nijedan tekst nema dijakritiku', () => {
    expect(allStrings.filter(tekst => /[čćšžđČĆŠŽĐ]/.test(tekst))).toStrictEqual([])
  })

  it('formatiranje i citanje datuma su uparena', () => {
    const datum = new Date(2026, 8, 22)
    expect(calendar.formatDate(datum)).toBe('22.09.2026')
    expect(calendar.parseDateFromString('22.09.2026')?.getTime()).toBe(datum.getTime())
  })
})
