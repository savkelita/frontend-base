import { it } from '@effect/vitest'
import { Chunk, Effect, Fiber, Stream, TestClock, type Duration } from 'effect'
import { describe, expect } from 'vitest'
import { subscriptions } from '../index'

const vremena = (koliko: number, pomeraj: Duration.DurationInput) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(Stream.runCollect(Stream.take(subscriptions(), koliko)))
    yield* TestClock.adjust(pomeraj)
    const otkucaji = yield* Fiber.join(fiber)
    return Chunk.toReadonlyArray(otkucaji).map(msg => (msg._tag === 'Otkucaj' ? msg.sada : -1))
  })

describe('otkucaj sata', () => {
  // Prvi otkucaj mora da stigne odmah: inace bi vec istekla sesija cekala pun interval na odjavu.
  it.effect('javlja se odmah, pa u ravnomernom ritmu', () =>
    Effect.gen(function* () {
      expect(yield* vremena(3, '20 seconds')).toStrictEqual([0, 10_000, 20_000])
    }),
  )

  it.effect('ritam ne zanosi kroz duze vreme', () =>
    Effect.gen(function* () {
      expect(yield* vremena(7, '60 seconds')).toStrictEqual([0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000])
    }),
  )
})
