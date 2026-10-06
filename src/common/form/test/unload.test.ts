// @vitest-environment happy-dom
import { Effect, Fiber, Stream } from 'effect'
import * as Sub from 'tea-effect/Sub'
import { describe, expect, it } from 'vitest'
import { unloadGuard } from '../unload'

const napustaSe = (): boolean => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return !event.defaultPrevented
}

const tik = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

const pokreni = async (sub: Sub.Sub<never>): Promise<() => Promise<void>> => {
  const fiber = Effect.runFork(Effect.scoped(Stream.runDrain(sub)))
  await tik()
  return async () => {
    await Effect.runPromise(Fiber.interrupt(fiber))
    await tik()
  }
}

describe('cuvar odlaska sa strane', () => {
  it('bez izmena nema pretplate', () => {
    expect(Sub.getSubEntries(unloadGuard(false))).toHaveLength(0)
  })

  it('sa izmenama odlazak trazi potvrdu', async () => {
    const stani = await pokreni(unloadGuard(true))
    expect(napustaSe()).toBe(false)
    await stani()
  })

  // Bez ovoga bi zatvoren dijalog nastavio da zaustavlja odlazak sa strane.
  it('gasenjem pretplate osluskivac nestaje', async () => {
    const stani = await pokreni(unloadGuard(true))
    await stani()
    expect(napustaSe()).toBe(true)
  })
})
