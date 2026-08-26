import { Either, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { format, fromIso, ioValue, toIso } from '../api'

const decode = Schema.decodeUnknownEither(ioValue)

describe('DateTime sa zice', () => {
  describe('ioValue', () => {
    it('pretvara zapis sa zice u pravi Date', () => {
      const result = decode('2026-08-21T16:02:07')
      expect(Either.isRight(result)).toBe(true)
      if (!Either.isRight(result)) return
      expect(result.right).toBeInstanceOf(Date)
      expect([result.right.getHours(), result.right.getMinutes(), result.right.getSeconds()]).toStrictEqual([16, 2, 7])
    })

    // Enkodovana strana je namerno Date, a ne string: samo tako `A === I`, sto je
    // ono sto `Http.expectJson` trazi. Dekodiranje ipak prima `unknown`.
    it('pusta Date da prodje nepromenjen', () => {
      const now = new Date(2026, 7, 21, 16, 2, 7)
      expect(decode(now)).toStrictEqual(Either.right(now))
    })

    it('odbija zapis koji nije datum', () => {
      expect(Either.isLeft(decode('nije datum'))).toBe(true)
    })

    it('odbija dan bez vremena, to je Date a ne DateTime', () => {
      expect(Either.isLeft(decode('2026-08-21'))).toBe(true)
    })

    it('odbija broj', () => {
      expect(Either.isLeft(decode(1755792127000))).toBe(true)
    })
  })

  describe('fromIso', () => {
    it('cita trenutak kao lokalno vreme, jer ga backend tako i salje', () => {
      const date = fromIso('2026-08-21T16:02:07')
      expect(date).not.toBeNull()
      if (date === null) return
      expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toStrictEqual([2026, 8, 21])
    })

    it('podnosi zapis bez sekundi', () => {
      expect(fromIso('2026-08-21T16:02')?.getSeconds()).toBe(0)
    })

    it('podnosi visak na kraju umesto da pukne', () => {
      expect(fromIso('2026-08-21T16:02:07.512Z')?.getMinutes()).toBe(2)
    })

    it('odbija datum koji se prevrce', () => {
      expect(fromIso('2026-02-31T10:00:00')).toBeNull()
    })
  })

  describe('toIso', () => {
    it('vraca isti trenutak kroz oba smera', () => {
      const date = new Date(2026, 2, 7, 9, 5, 3)
      expect(fromIso(toIso(date))).toStrictEqual(date)
    })

    it('salje lokalno vreme, a ne UTC', () => {
      expect(toIso(new Date(2026, 7, 21, 16, 2, 7))).toBe('2026-08-21T16:02:07')
    })
  })

  describe('format', () => {
    it('pise srpski zapis sa vremenom', () => {
      expect(format(new Date(2026, 7, 21, 16, 2, 7))).toBe('21.08.2026 16:02')
    })

    it('dopunjava nulama', () => {
      expect(format(new Date(2026, 2, 7, 9, 5))).toBe('07.03.2026 09:05')
    })
  })
})
