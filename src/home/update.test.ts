import { describe, it, expect } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import { Msg } from './msg'
import { init, update } from './index'

describe('Home', () => {
  describe('init', () => {
    it('should return model with count 0 and no command', () => {
      const [model, cmd] = init
      expect(model).toEqual({ count: 0 })
      expect(cmd).toBe(Cmd.none)
    })
  })

  describe('update', () => {
    it('should increment count', () => {
      const [model] = init
      const [newModel, cmd] = update(Msg.Increment(), model)
      expect(newModel.count).toBe(1)
      expect(cmd).toBe(Cmd.none)
    })

    it('should decrement count', () => {
      const [model] = init
      const [newModel, cmd] = update(Msg.Decrement(), model)
      expect(newModel.count).toBe(-1)
      expect(cmd).toBe(Cmd.none)
    })

    it('should reset count to 0', () => {
      const [newModel, cmd] = update(Msg.Reset(), { count: 5 })
      expect(newModel.count).toBe(0)
      expect(cmd).toBe(Cmd.none)
    })
  })
})
