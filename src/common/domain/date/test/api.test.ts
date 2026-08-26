import { Either, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { format, fromYmd, ioValue, toYmd } from '../api'

const decode = Schema.decodeUnknownEither(ioValue)

/** Ono sto DatePicker ostavi u modelu: lokalna ponoc izabranog dana. */
const picked = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

describe('Date sa zice', () => {
  describe('ioValue', () => {
    it('cita kalendarski dan u lokalnu ponoc', () => {
      const result = decode('2026-08-06')
      expect(Either.isRight(result)).toBe(true)
      if (!Either.isRight(result)) return
      expect([result.right.getFullYear(), result.right.getMonth() + 1, result.right.getDate()]).toStrictEqual([
        2026, 8, 6,
      ])
      expect(result.right.getHours()).toBe(0)
    })

    // Enkodovana strana je namerno Date, a ne string: samo tako `A === I`, sto je
    // ono sto `Http.expectJson` trazi. Dekodiranje ipak prima `unknown`.
    it('pusta Date da prodje nepromenjen', () => {
      const day = picked(2026, 8, 6)
      expect(decode(day)).toStrictEqual(Either.right(day))
    })

    it('odbija datum koji se prevrce', () => {
      expect(Either.isLeft(decode('2026-02-31'))).toBe(true)
    })

    it('odbija ISO trenutak — konvencija trazi dan bez vremena', () => {
      expect(Either.isLeft(decode('2026-08-06T00:00:00.000Z'))).toBe(true)
    })

    it('odbija srpski zapis, to je format prikaza', () => {
      expect(Either.isLeft(decode('06.08.2026.'))).toBe(true)
    })

    it('odbija broj', () => {
      expect(Either.isLeft(decode(1754431200000))).toBe(true)
    })
  })

  describe('toYmd', () => {
    it('salje izabrani dan, a ne UTC trenutak — leti (UTC+2)', () => {
      // `toISOString().slice(0, 10)` bi ovde dao 2026-08-05.
      expect(toYmd(picked(2026, 8, 6))).toBe('2026-08-06')
    })

    it('salje izabrani dan i zimi, kad je pomeraj drugaciji (UTC+1)', () => {
      expect(toYmd(picked(2026, 1, 15))).toBe('2026-01-15')
    })

    it('ne gubi dan ni na prelasku godine', () => {
      expect(toYmd(picked(2026, 1, 1))).toBe('2026-01-01')
    })

    it('dopunjava nulama', () => {
      expect(toYmd(picked(2026, 3, 7))).toBe('2026-03-07')
    })
  })

  describe('fromYmd', () => {
    it('vraca isti dan kroz oba smera', () => {
      expect(fromYmd(toYmd(picked(2026, 8, 6)))).toStrictEqual(picked(2026, 8, 6))
    })

    it('odbija datum koji se prevrce', () => {
      expect(fromYmd('2026-02-31')).toBeNull()
    })
  })

  describe('format', () => {
    it('pise srpski zapis dana', () => {
      expect(format(picked(2026, 8, 6))).toBe('06.08.2026')
    })

    it('dopunjava nulama', () => {
      expect(format(picked(2026, 3, 7))).toBe('07.03.2026')
    })
  })
})
