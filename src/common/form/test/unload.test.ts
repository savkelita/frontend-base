// @vitest-environment happy-dom
import { Effect, Fiber, Stream } from 'effect'
import * as Sub from 'tea-effect/Sub'
import { describe, expect, it } from 'vitest'
import { unloadGuard } from '../unload'

const leaves = (): boolean => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return !event.defaultPrevented
}

const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

const run = async (sub: Sub.Sub<never>): Promise<() => Promise<void>> => {
  const fiber = Effect.runFork(Effect.scoped(Stream.runDrain(sub)))
  await tick()
  return async () => {
    await Effect.runPromise(Fiber.interrupt(fiber))
    await tick()
  }
}

describe('cuvar odlaska sa strane', () => {
  it('bez izmena nema pretplate', () => {
    expect(Sub.getSubEntries(unloadGuard(false))).toHaveLength(0)
  })

  it('sa izmenama odlazak trazi potvrdu', async () => {
    const stop = await run(unloadGuard(true))
    expect(leaves()).toBe(false)
    await stop()
  })

  it('gasenjem pretplate osluskivac nestaje', async () => {
    const stop = await run(unloadGuard(true))
    await stop()
    expect(leaves()).toBe(true)
  })
})
