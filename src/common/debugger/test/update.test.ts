import { Chunk, Data, Effect, Option, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { app, jumped, update, type Model, type Msg } from '../index'

type Counted = Data.TaggedEnum<{ Incremented: {}; Echoed: {} }>

const Counted = Data.taggedEnum<Counted>()

const counter = (msg: Counted, count: number): [number, Cmd.Cmd<Counted>] =>
  Counted.$match(msg, {
    Incremented: (): [number, Cmd.Cmd<Counted>] => [count + 1, Cmd.none],
    Echoed: (): [number, Cmd.Cmd<Counted>] => [count, Cmd.of(Counted.Incremented())],
  })

const model = (count: number): Model<number, Counted> => ({ app: count, last: Option.none() })

const run = (cmd: Cmd.Cmd<Msg<number, Counted>>): Promise<ReadonlyArray<Msg<number, Counted>>> =>
  Effect.runPromise(Stream.runCollect(cmd)).then(Chunk.toReadonlyArray)

describe('omotac oko update-a', () => {
  it('poruka aplikacije prolazi kroz njen update i pamti se kao poslednja', () => {
    const [next] = update(counter, app(Counted.Incremented()), model(1))

    expect(next).toStrictEqual({ app: 2, last: Option.some(Counted.Incremented()) })
  })

  it('komanda aplikacije vraca poruke kroz omotac', async () => {
    const [, cmd] = update(counter, app(Counted.Echoed()), model(1))

    expect(await run(cmd)).toStrictEqual([app(Counted.Incremented())])
  })

  it('skok zameni model aplikacije, ne pamti poruku i ne pokrece komandu', () => {
    const [next, cmd] = update(counter, jumped(7), { app: 1, last: Option.some(Counted.Incremented()) })

    expect(next).toStrictEqual(model(7))
    expect(cmd).toBe(Cmd.none)
  })
})
