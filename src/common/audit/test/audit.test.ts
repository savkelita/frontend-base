import { Either, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { Audit, promenjen, renderUser, type Audit as AuditValue } from '../audit'

const decode = Schema.decodeUnknownEither(Audit)

const KREIRAN_ZICA = {
  korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
  datumKreiranja: '2026-08-12T09:14:00',
  korisnikPromenio: null,
  datumPromene: null,
}

const IZMENJEN_ZICA = {
  ...KREIRAN_ZICA,
  korisnikPromenio: { ime: 'Ana', prezime: 'Anic' },
  datumPromene: '2026-08-21T16:02:00',
}

const kreiran: AuditValue = {
  korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
  datumKreiranja: new Date(2026, 7, 12, 9, 14),
  korisnikPromenio: null,
  datumPromene: null,
}

describe('Audit', () => {
  it('cita zapis o kreiranju i izmeni, sa pravim datumima', () => {
    expect(decode(IZMENJEN_ZICA)).toStrictEqual(
      Either.right({
        korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
        datumKreiranja: new Date(2026, 7, 12, 9, 14),
        korisnikPromenio: { ime: 'Ana', prezime: 'Anic' },
        datumPromene: new Date(2026, 7, 21, 16, 2),
      }),
    )
  })

  it('cita zapis koji jos nije menjan', () => {
    expect(decode(KREIRAN_ZICA)).toStrictEqual(Either.right(kreiran))
  })

  it('odbija zapis bez korisnika koji je kreirao', () => {
    expect(Either.isLeft(decode({ ...KREIRAN_ZICA, korisnikKreirao: null }))).toBe(true)
  })

  it('odbija datum koji nije datum', () => {
    expect(Either.isLeft(decode({ ...KREIRAN_ZICA, datumKreiranja: 'juce' }))).toBe(true)
  })

  describe('promenjen', () => {
    it('prepoznaje izmenjen zapis', () => {
      expect(promenjen({ ...kreiran, datumPromene: new Date(2026, 7, 21) })).toBe(true)
    })

    it('prepoznaje netaknut zapis', () => {
      expect(promenjen(kreiran)).toBe(false)
    })

    it('prijavljuje izmenu i kada backend posalje samo jedno od dva polja', () => {
      expect(promenjen({ ...kreiran, korisnikPromenio: { ime: 'Ana', prezime: 'Anic' } })).toBe(true)
    })
  })

  describe('renderUser', () => {
    it('spaja ime i prezime', () => {
      expect(renderUser({ ime: 'Ana', prezime: 'Anic' })).toBe('Ana Anic')
    })

    it('daje prazan tekst kada korisnika nema', () => {
      expect(renderUser(null)).toBe('')
    })
  })
})
