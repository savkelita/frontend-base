import { describe, expect, it } from 'vitest'
import { memoize } from '../index'

const counted = <B>(value: (n: number) => B) => {
  let calls = 0
  const f = memoize((key: { id: number }) => {
    calls++
    return value(key.id)
  })
  return { f, calls: () => calls }
}

describe('memoize', () => {
  it('racuna jednom po kljucu i vraca isti objekat', () => {
    const { f, calls } = counted(id => ({ id }))
    const key = { id: 1 }
    expect(f(key)).toBe(f(key))
    expect(calls()).toBe(1)
  })

  it('razliciti kljucevi imaju svaki svoju vrednost', () => {
    const { f } = counted(id => ({ id }))
    expect(f({ id: 1 })).not.toBe(f({ id: 2 }))
  })

  // Ovo je bila zamerka na keš od jednog mesta: naizmenicni kljucevi su se mlatili,
  // svaki poziv je promasivao i memo granica ispod je tiho prestajala da radi.
  it('naizmenicni kljucevi se ne izbacuju', () => {
    const { f, calls } = counted(id => ({ id }))
    const prvi = { id: 1 }
    const drugi = { id: 2 }

    f(prvi)
    f(drugi)
    f(prvi)
    f(drugi)

    expect(calls()).toBe(2)
  })

  it('jednake ali razlicite reference se ne dele', () => {
    const { f, calls } = counted(id => ({ id }))
    f({ id: 1 })
    f({ id: 1 })
    expect(calls()).toBe(2)
  })

  it('pamti i vrednost undefined', () => {
    const { f, calls } = counted(() => undefined)
    const key = { id: 1 }
    expect(f(key)).toBeUndefined()
    expect(f(key)).toBeUndefined()
    expect(calls()).toBe(1)
  })
})
