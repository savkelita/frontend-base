import { it } from '@effect/vitest'
import { Chunk, Effect, Fiber, Stream, TestClock, type Duration } from 'effect'
import { describe, expect } from 'vitest'
import { subscriptions } from '../index'

const ticks = (count: number, by: Duration.DurationInput) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(Stream.runCollect(Stream.take(subscriptions(), count)))
    yield* TestClock.adjust(by)
    const collected = yield* Fiber.join(fiber)
    return Chunk.toReadonlyArray(collected).map(msg => (msg._tag === 'Tick' ? msg.now : -1))
  })

describe('otkucaj sata', () => {
  it.effect('javlja se odmah, pa u ravnomernom ritmu', () =>
    Effect.gen(function* () {
      expect(yield* ticks(3, '20 seconds')).toStrictEqual([0, 10_000, 20_000])
    }),
  )

  it.effect('ritam ne zanosi kroz duze vreme', () =>
    Effect.gen(function* () {
      expect(yield* ticks(7, '60 seconds')).toStrictEqual([0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000])
    }),
  )
})
