import { Either, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { ioValue } from '../api'

const encode = Schema.encodeEither(ioValue)
const decode = Schema.decodeUnknownEither(ioValue)

/** Ono sto DatePicker ostavi u modelu: lokalna ponoc izabranog dana. */
const picked = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

describe('Date na zici', () => {
  describe('encode', () => {
    it('salje izabrani dan, a ne UTC trenutak — leti (UTC+2)', () => {
      // `toISOString().slice(0, 10)` bi ovde dao 2026-08-05.
      expect(encode(picked(2026, 8, 6))).toStrictEqual(Either.right('2026-08-06'))
    })

    it('salje izabrani dan i zimi, kad je pomeraj drugaciji (UTC+1)', () => {
      expect(encode(picked(2026, 1, 15))).toStrictEqual(Either.right('2026-01-15'))
    })

    it('ne gubi dan ni na prelasku godine', () => {
      expect(encode(picked(2026, 1, 1))).toStrictEqual(Either.right('2026-01-01'))
    })

    it('dopunjava nulama', () => {
      expect(encode(picked(2026, 3, 7))).toStrictEqual(Either.right('2026-03-07'))
    })
  })

  describe('decode', () => {
    it('cita kalendarski dan u lokalnu ponoc', () => {
      const result = decode('2026-08-06')
      expect(Either.isRight(result)).toBe(true)
      if (!Either.isRight(result)) return
      expect([result.right.getFullYear(), result.right.getMonth() + 1, result.right.getDate()]).toStrictEqual([
        2026, 8, 6,
      ])
      expect(result.right.getHours()).toBe(0)
    })

    it('vraca isti dan kroz oba smera', () => {
      expect(encode(picked(2026, 8, 6)).pipe(Either.flatMap(decode), Either.flatMap(encode))).toStrictEqual(
        Either.right('2026-08-06'),
      )
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
  })
})
