import { describe, it, expect } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import { init, update } from './index'

describe('Home', () => {
  describe('init', () => {
    it('should return empty model and no command', () => {
      const [model, cmd] = init
      expect(model).toEqual({})
      expect(cmd).toBe(Cmd.none)
    })
  })

  describe('update', () => {
    it('should return unchanged model for any message', () => {
      const [model] = init
      const msg = undefined as never
      const [newModel, cmd] = update(msg, model)
      expect(newModel).toBe(model)
      expect(cmd).toBe(Cmd.none)
    })
  })
})
