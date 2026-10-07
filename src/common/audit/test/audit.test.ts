import { Either, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { Audit, changed, renderUser, type Audit as AuditValue } from '../audit'

const decode = Schema.decodeUnknownEither(Audit)

const CREATED_WIRE = {
  korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
  datumKreiranja: '2026-08-12T09:14:00',
  korisnikPromenio: null,
  datumPromene: null,
}

const UPDATED_WIRE = {
  ...CREATED_WIRE,
  korisnikPromenio: { ime: 'Ana', prezime: 'Anic' },
  datumPromene: '2026-08-21T16:02:00',
}

const created: AuditValue = {
  korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
  datumKreiranja: new Date(2026, 7, 12, 9, 14),
  korisnikPromenio: null,
  datumPromene: null,
}

describe('Audit', () => {
  it('cita zapis o kreiranju i izmeni, sa pravim datumima', () => {
    expect(decode(UPDATED_WIRE)).toStrictEqual(
      Either.right({
        korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
        datumKreiranja: new Date(2026, 7, 12, 9, 14),
        korisnikPromenio: { ime: 'Ana', prezime: 'Anic' },
        datumPromene: new Date(2026, 7, 21, 16, 2),
      }),
    )
  })

  it('cita zapis koji jos nije menjan', () => {
    expect(decode(CREATED_WIRE)).toStrictEqual(Either.right(created))
  })

  it('odbija zapis bez korisnika koji je kreirao', () => {
    expect(Either.isLeft(decode({ ...CREATED_WIRE, korisnikKreirao: null }))).toBe(true)
  })

  it('odbija datum koji nije datum', () => {
    expect(Either.isLeft(decode({ ...CREATED_WIRE, datumKreiranja: 'juce' }))).toBe(true)
  })

  describe('promenjen', () => {
    it('prepoznaje izmenjen zapis', () => {
      expect(changed({ ...created, datumPromene: new Date(2026, 7, 21) })).toBe(true)
    })

    it('prepoznaje netaknut zapis', () => {
      expect(changed(created)).toBe(false)
    })

    it('prijavljuje izmenu i kada backend posalje samo jedno od dva polja', () => {
      expect(changed({ ...created, korisnikPromenio: { ime: 'Ana', prezime: 'Anic' } })).toBe(true)
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
