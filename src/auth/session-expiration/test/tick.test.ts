import { Effect, Fiber, Stream, type Duration } from 'effect'
import { TestClock } from 'effect/testing'
import { describe, expect, it } from 'vitest'
import { subscriptions } from '../index'

const ticks = (count: number, by: Duration.Input) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(Stream.runCollect(Stream.take(subscriptions(), count)))
    yield* TestClock.adjust(by)
    const collected = yield* Fiber.join(fiber)
    return collected.map(msg => (msg._tag === 'Tick' ? msg.now : -1))
  })

const runTest = <A, E>(effect: Effect.Effect<A, E>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, TestClock.layer()))

describe('otkucaj sata', () => {
  it('javlja se odmah, pa u ravnomernom ritmu', () =>
    runTest(
      Effect.gen(function* () {
        expect(yield* ticks(3, '20 seconds')).toStrictEqual([0, 10_000, 20_000])
      }),
    ))

  it('ritam ne zanosi kroz duze vreme', () =>
    runTest(
      Effect.gen(function* () {
        expect(yield* ticks(7, '60 seconds')).toStrictEqual([0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000])
      }),
    ))
})
