import { FastCheck } from 'effect'
import { describe, expect, it } from 'vitest'
import { contains, eq, predicateValue, range, rangeValue, type DateRange } from '../predicate'

const dan = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

describe('contains', () => {
  it('popunjeno polje daje predikat', () => {
    expect(contains('Pera')).toStrictEqual(['contains', 'Pera'])
  })

  it('prazno polje ne daje kriterijum', () => {
    expect(contains(null)).toBeUndefined()
    expect(contains('')).toBeUndefined()
  })

  it('razmak je unos, ne praznina — BE odlucuje sta ce sa njim', () => {
    expect(contains(' ')).toStrictEqual(['contains', ' '])
  })
})

describe('eq', () => {
  it('izabrana vrednost daje predikat', () => {
    expect(eq('AKTIVAN')).toStrictEqual(['eq', 'AKTIVAN'])
  })

  it('nista izabrano ne daje kriterijum', () => {
    expect(eq(null)).toBeUndefined()
  })
})

describe('predicateValue', () => {
  it('vraca vrednost, bez obzira na operator', () => {
    expect(predicateValue(['contains', 'Pera'])).toBe('Pera')
    expect(predicateValue(['starts_with', 'Pera'])).toBe('Pera')
    expect(predicateValue(['eq', 'AKTIVAN'])).toBe('AKTIVAN')
  })

  it('kriterijuma nema, pa ni vrednosti', () => {
    expect(predicateValue(undefined)).toBeNull()
  })

  // Ovo drzi obe strane: sto `contains` napravi, `predicateValue` vrati.
  it('vraca ono sto je uslo', () => {
    expect(predicateValue(contains('Pera'))).toBe('Pera')
    expect(predicateValue(eq('PASIVAN'))).toBe('PASIVAN')
  })
})

describe('range', () => {
  // Oba datuma idu kao jedna vrednost, spojena tildom — tako ih BE i prima.
  it('oba datuma daju between', () => {
    expect(range([dan(2020, 1, 1), dan(2020, 12, 31)])).toStrictEqual(['between', '2020-01-01~2020-12-31'])
  })

  // Pola opsega je pretraga kao i svaka druga, samo je operator drugi.
  it('jedan kraj daje granicu koja taj dan ukljucuje', () => {
    expect(range([dan(2020, 1, 1), null])).toStrictEqual(['after_or_same', '2020-01-01'])
    expect(range([null, dan(2020, 12, 31)])).toStrictEqual(['before_or_same', '2020-12-31'])
  })

  it('prazan opseg nije kriterijum', () => {
    expect(range([null, null])).toBeUndefined()
    expect(range(null)).toBeUndefined()
  })

  // Obrnut opseg se ne odbija: BE na njega prosto ne vrati nijedan slog.
  it('obrnut opseg ide na server takav kakav je', () => {
    expect(range([dan(2020, 12, 31), dan(2020, 1, 1)])).toStrictEqual(['between', '2020-12-31~2020-01-01'])
  })

  // Isti razlog kao kod `toYmd`: `toISOString` bi ovde pomerio dan unazad.
  it('salje izabrani dan, ne UTC trenutak', () => {
    expect(range([dan(2026, 8, 6), dan(2026, 8, 6)])).toStrictEqual(['between', '2026-08-06~2026-08-06'])
  })
})

describe('rangeValue', () => {
  it('vraca ono sto je uslo, za sva tri operatora', () => {
    expect(rangeValue(range([dan(2020, 1, 1), dan(2020, 12, 31)]))).toStrictEqual([dan(2020, 1, 1), dan(2020, 12, 31)])
    expect(rangeValue(range([dan(2020, 1, 1), null]))).toStrictEqual([dan(2020, 1, 1), null])
    expect(rangeValue(range([null, dan(2020, 12, 31)]))).toStrictEqual([null, dan(2020, 12, 31)])
  })

  it('kriterijuma nema, pa ni opsega', () => {
    expect(rangeValue(undefined)).toBeNull()
  })

  // Polje pise samo `between`, `after_or_same` i `before_or_same`; strogu granicu ne ume da prikaze.
  it('operatori koje polje ne pise ne mogu u opseg', () => {
    expect(rangeValue(['before', '2020-01-01'])).toBeNull()
    expect(rangeValue(['after', '2020-01-01'])).toBeNull()
    expect(rangeValue(['eq', '2020-01-01'])).toBeNull()
  })

  it('pokvarena vrednost iz adrese daje prazno, ne pucanje', () => {
    expect(rangeValue(['between', 'nije datum~2020-12-31'])).toStrictEqual([null, dan(2020, 12, 31)])
    expect(rangeValue(['between', ''])).toBeNull()
    expect(rangeValue(['between', '2020-01-01'])).toStrictEqual([dan(2020, 1, 1), null])
    expect(rangeValue(['after_or_same', 'nije datum'])).toBeNull()
  })
})

const danArb = FastCheck.date({
  min: new Date(2000, 0, 1),
  max: new Date(2050, 11, 31),
  noInvalidDate: true,
}).map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()))

const krajArb = FastCheck.option(danArb, { nil: null })

describe('svojstva', () => {
  // Sto polje napise u adresu, iz adrese se vrati isto — bez obzira koji je kraj popunjen.
  it('opseg prezivi put kroz adresu', () => {
    FastCheck.assert(
      FastCheck.property(krajArb, krajArb, (od, doDatuma) => {
        const value: DateRange = [od, doDatuma]
        const prazan = od === null && doDatuma === null
        expect(rangeValue(range(value))).toStrictEqual(prazan ? null : value)
      }),
    )
  })
})
