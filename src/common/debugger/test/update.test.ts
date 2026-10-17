import { Chunk, Data, Effect, Option, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { app, jumped, requested, update, type Model, type Msg } from '../index'

type Counted = Data.TaggedEnum<{ Incremented: {}; Echoed: {} }>

const Counted = Data.taggedEnum<Counted>()

const counter = (msg: Counted, count: number): [number, Cmd.Cmd<Counted>] =>
  Counted.$match(msg, {
    Incremented: (): [number, Cmd.Cmd<Counted>] => [count + 1, Cmd.none],
    Echoed: (): [number, Cmd.Cmd<Counted>] => [count, Cmd.of(Counted.Incremented())],
  })

const live = (count: number): Model<number, Counted> => ({
  app: count,
  last: Option.none(),
  shown: Option.none(),
  queue: [],
})

const paused = (count: number, shown: number, queue: ReadonlyArray<Counted> = []): Model<number, Counted> => ({
  app: count,
  last: Option.none(),
  shown: Option.some(shown),
  queue,
})

const run = (cmd: Cmd.Cmd<Msg<number, Counted>>): Promise<ReadonlyArray<Msg<number, Counted>>> =>
  Effect.runPromise(Stream.runCollect(cmd)).then(Chunk.toReadonlyArray)

describe('zivo stanje', () => {
  it('poruka aplikacije prolazi kroz njen update i pamti se kao poslednja', () => {
    const [next] = update(counter, app(Counted.Incremented()), live(1))

    expect(next).toStrictEqual({ ...live(2), last: Option.some(Counted.Incremented()) })
  })

  it('komanda aplikacije vraca poruke kroz omotac', async () => {
    const [, cmd] = update(counter, app(Counted.Echoed()), live(1))

    expect(await run(cmd)).toStrictEqual([app(Counted.Incremented())])
  })

  it('klik na link radi kao i svaka druga poruka', () => {
    const [next] = update(counter, requested(Counted.Incremented()), live(1))

    expect(next.app).toBe(2)
  })
})

describe('pregled istorije', () => {
  it('skok na staro stanje ga prikaze, a zivo stanje ostaje', () => {
    const [next, cmd] = update(counter, jumped(7), live(1))

    expect(next).toStrictEqual(paused(1, 7))
    expect(cmd).toBe(Cmd.none)
  })

  it('poruka pretplate ili komande ceka i ne dira zivo stanje', () => {
    const [next, cmd] = update(counter, app(Counted.Incremented()), paused(1, 7))

    expect(next).toStrictEqual(paused(1, 7, [Counted.Incremented()]))
    expect(cmd).toBe(Cmd.none)
  })

  it('klik na link u starom stanju se odbacuje', () => {
    const model = paused(1, 7)

    expect(update(counter, requested(Counted.Incremented()), model)).toStrictEqual([model, Cmd.none])
  })

  it('povratak na zivo stanje pusti poruke koje su cekale, redom', async () => {
    const [next, cmd] = update(counter, jumped(1), paused(1, 7, [Counted.Incremented(), Counted.Echoed()]))

    expect(next).toStrictEqual(live(1))
    expect(await run(cmd)).toStrictEqual([app(Counted.Incremented()), app(Counted.Echoed())])
  })
})
