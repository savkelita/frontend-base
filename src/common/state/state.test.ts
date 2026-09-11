import { describe, it, expect, vi, afterEach } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import * as State from './index'

// -------------------------------------------------------------------------------------
// Стање учитавања
// -------------------------------------------------------------------------------------
//
// Најважније што овде треба да важи: порука која стигне у стање у ком нема смисла не сме
// да буде прећутана. Тихо гутање значи да грешка у ожичењу остане невидљива.

afterEach(() => vi.restoreAllMocks())

describe('onLoaded', () => {
  type Red = { readonly id: number }
  const izmena = (record: Red): [State.Load<Red>, Cmd.Cmd<never>] => [State.loaded({ id: record.id + 1 }), Cmd.none]

  it('пушта поруку кроз кад је запис учитан', () => {
    const [sledeci] = State.onLoaded(State.loaded({ id: 1 }), 'message')(izmena)
    expect(State.valueOf(sledeci)).toEqual({ id: 2 })
  })

  it('док се учитава враћа непромењено и упозори', () => {
    const upozorenje = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const model = State.loading as State.Load<Red>
    const [sledeci, cmd] = State.onLoaded(model, 'message')(izmena)
    expect(sledeci).toBe(model)
    expect(cmd).toBe(Cmd.none)
    expect(upozorenje).toHaveBeenCalledOnce()
  })

  it('исто важи и кад учитавање није успело', () => {
    const upozorenje = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const model = State.failed<Red>('нема везе')
    const [sledeci] = State.onLoaded(model, 'message')(izmena)
    expect(sledeci).toBe(model)
    expect(upozorenje).toHaveBeenCalledOnce()
  })

  it('неутралан исход стиже нетакнут кад записа нема', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const model = State.loading as State.Load<Red>
    const [, , ishod] = State.onLoaded(model, 'message', 'aktivan')(record => [State.loaded(record), Cmd.none, 'uspeh'])
    expect(ishod).toBe('aktivan')
  })
})

describe('valueOf', () => {
  it('даје учитану вредност, иначе ништа', () => {
    expect(State.valueOf(State.loaded({ id: 7 }))).toEqual({ id: 7 })
    expect(State.valueOf(State.loading)).toBeUndefined()
    expect(State.valueOf(State.failed('пукло'))).toBeUndefined()
  })
})
