import { Chunk, Effect, Fiber, Stream } from 'effect'
import type * as Cmd from 'tea-effect/Cmd'
import { afterEach, describe, expect, it } from 'vitest'
import { failure, notify, register, success, type Toast } from '../toast'

const run = <Msg>(cmd: Cmd.Cmd<Msg>): Promise<ReadonlyArray<Msg>> =>
  Effect.runPromise(Stream.runCollect(cmd)).then(Chunk.toReadonlyArray)

const tick = (ms = 0): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

let unregister: (() => void) | null = null

const collect = (): Array<Toast> => {
  const raised: Array<Toast> = []
  unregister = register(toast => void raised.push(toast))
  return raised
}

// Komanda sa akcijom se ne zavrsava kad se toast prikaze, pa runCollect ne
// moze da je saceka - mora fiber, isto kao sto je tea-effect vrti u programu.
const drive = async <Msg>(
  cmd: Cmd.Cmd<Msg>,
  act: (toast: Toast) => void,
): Promise<{ readonly msgs: ReadonlyArray<Msg>; readonly closed: boolean }> => {
  const raised = collect()
  const msgs: Array<Msg> = []
  const fiber = Effect.runFork(Stream.runForEach(cmd, msg => Effect.sync(() => void msgs.push(msg))))

  await tick()
  const shown = raised[0]
  if (shown !== undefined) act(shown)

  const closed = await Promise.race([Effect.runPromise(Fiber.join(fiber)).then(() => true), tick(50).then(() => false)])
  if (!closed) Effect.runFork(Fiber.interrupt(fiber))

  return { msgs, closed }
}

afterEach(() => {
  unregister?.()
  unregister = null
})

describe('toast kao Cmd', () => {
  it('podigne poruku tek kad se komanda izvrsi, ne kad se napravi', async () => {
    const raised = collect()

    const cmd = success('Vozac je sacuvan.')
    expect(raised).toStrictEqual([])

    await run(cmd)
    expect(raised).toStrictEqual([
      { intent: 'success', title: 'Vozac je sacuvan.', body: null, action: null, close: expect.any(Function) },
    ])
  })

  it('bez callback-a ne emituje nijednu poruku', async () => {
    collect()

    expect(await run(success('Sacuvano.'))).toStrictEqual([])
  })

  it('emituje poruku iz callback-a', async () => {
    collect()

    expect(await run(failure('Nije uspelo.', { then: () => 'dismiss' as const }))).toStrictEqual(['dismiss'])
  })

  it('nosi telo poruke kada je dato', async () => {
    const raised = collect()

    await run(notify('warning', 'Sacuvano', { body: 'Ali nije u tekucem filteru.' }))
    expect(raised[0]?.body).toBe('Ali nije u tekucem filteru.')
  })

  it('posle odjave vise ne isporucuje', async () => {
    const raised = collect()
    unregister?.()

    await run(success('Nikom.'))
    expect(raised).toStrictEqual([])
  })

  it('ne puca kada niko nije prijavljen', async () => {
    expect(await run(success('Nikom.'))).toStrictEqual([])
  })
})

describe('akcija u toastu', () => {
  const otvori = success('Vozac je sacuvan.', {
    action: { label: 'Idi na pregled', msg: () => 'otvori:42' as const },
  })

  it('klik vrati poruku i zatvori komandu', async () => {
    expect(await drive(otvori, toast => toast.action?.run())).toStrictEqual({ msgs: ['otvori:42'], closed: true })
  })

  it('bez klika komanda ceka dok toast ne nestane', async () => {
    expect(await drive(otvori, () => {})).toStrictEqual({ msgs: [], closed: false })
    expect(await drive(otvori, toast => toast.close())).toStrictEqual({ msgs: [], closed: true })
  })

  // Oba se dese u praksi: korisnik dvaput klikne, ili klikne pa toast istekne.
  it('dupli klik da jednu poruku, klik pa nestanak ne puca', async () => {
    expect(
      await drive(otvori, toast => {
        toast.action?.run()
        toast.action?.run()
      }),
    ).toStrictEqual({ msgs: ['otvori:42'], closed: true })

    expect(
      await drive(otvori, toast => {
        toast.action?.run()
        toast.close()
      }),
    ).toStrictEqual({ msgs: ['otvori:42'], closed: true })
  })

  it('kada prikaz nije prijavljen komanda se ne zaglavi', async () => {
    const msgs: Array<string> = []
    const fiber = Effect.runFork(Stream.runForEach(otvori, msg => Effect.sync(() => void msgs.push(msg))))

    await Effect.runPromise(Fiber.join(fiber))
    expect(msgs).toStrictEqual([])
  })
})
