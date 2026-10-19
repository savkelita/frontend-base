import { Result, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { format, fromYmd, ioValue, toYmd } from '../api'

const decode = Schema.decodeUnknownResult(ioValue)

/** Ono sto DatePicker ostavi u modelu: lokalna ponoc izabranog dana. */
const picked = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

describe('Date sa zice', () => {
  describe('ioValue', () => {
    it('cita kalendarski dan u lokalnu ponoc', () => {
      const result = decode('2026-08-06')
      expect(Result.isSuccess(result)).toBe(true)
      if (!Result.isSuccess(result)) return
      expect([result.success.getFullYear(), result.success.getMonth() + 1, result.success.getDate()]).toStrictEqual([
        2026, 8, 6,
      ])
      expect(result.success.getHours()).toBe(0)
    })

    it('pusta Date da prodje nepromenjen', () => {
      const day = picked(2026, 8, 6)
      expect(decode(day)).toStrictEqual(Result.succeed(day))
    })

    it('odbija datum koji se prevrce', () => {
      expect(Result.isFailure(decode('2026-02-31'))).toBe(true)
    })

    it('odbija ISO trenutak — konvencija trazi dan bez vremena', () => {
      expect(Result.isFailure(decode('2026-08-06T00:00:00.000Z'))).toBe(true)
    })

    it('odbija srpski zapis, to je format prikaza', () => {
      expect(Result.isFailure(decode('06.08.2026.'))).toBe(true)
    })

    it('odbija broj', () => {
      expect(Result.isFailure(decode(1754431200000))).toBe(true)
    })
  })

  describe('toYmd', () => {
    it('salje izabrani dan, a ne UTC trenutak — leti (UTC+2)', () => {
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
