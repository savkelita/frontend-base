import { DayOfWeek } from '@fluentui/react-calendar-compat'
import { describe, expect, it } from 'vitest'
import { kalendar } from '../date-field'

const { strings } = kalendar

const sviTekstovi: ReadonlyArray<string> = Object.values(strings).flatMap(value =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? value : [],
)

describe('lokalizacija kalendara', () => {
  // Fluent indeksira ove nizove sa getMonth() i getDay(), pa duzina nije kozmetika.
  it('meseci i dani imaju tacno onoliko clanova koliko se indeksira', () => {
    expect(strings.months).toHaveLength(12)
    expect(strings.shortMonths).toHaveLength(12)
    expect(strings.days).toHaveLength(7)
    expect(strings.shortDays).toHaveLength(7)
  })

  // Niz je 0-based na nedelji, bez obzira sto nedelja kod nas nije prvi dan.
  it('dani pocinju od nedelje jer to trazi getDay()', () => {
    expect(strings.days[0]).toBe('Nedelja')
    expect(strings.days[1]).toBe('Ponedeljak')
    expect(strings.days[6]).toBe('Subota')
  })

  it('meseci pocinju od januara', () => {
    expect(strings.months[0]).toBe('Januar')
    expect(strings.months[11]).toBe('Decembar')
  })

  // Podrazumevano je nedelja, sto kod nas pomera celu mrezu za jedan dan.
  it('nedelja prelazi na kraj, ponedeljak je prvi', () => {
    expect(kalendar.firstDayOfWeek).toBe(DayOfWeek.Monday)
  })

  it('skracenice dana se ne ponavljaju', () => {
    expect(new Set(strings.shortDays).size).toBe(7)
  })

  it('nijedan tekst nema dijakritiku', () => {
    expect(sviTekstovi.filter(tekst => /[čćšžđČĆŠŽĐ]/.test(tekst))).toStrictEqual([])
  })

  it('formatiranje i citanje datuma su uparena', () => {
    const datum = new Date(2026, 8, 22)
    expect(kalendar.formatDate(datum)).toBe('22.09.2026')
    expect(kalendar.parseDateFromString('22.09.2026')?.getTime()).toBe(datum.getTime())
  })
})
