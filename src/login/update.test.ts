import { describe, it, expect } from 'vitest'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { Msg } from './msg'
import { init, update } from './index'

describe('Login', () => {
  describe('init', () => {
    it('should return empty form model and no command', () => {
      const [model, cmd] = init
      expect(model.username).toBe('')
      expect(model.password).toBe('')
      expect(model.isSubmitting).toBe(false)
      expect(Option.isNone(model.error)).toBe(true)
      expect(Option.isNone(model.result)).toBe(true)
      expect(cmd).toBe(Cmd.none)
    })
  })

  describe('update', () => {
    it('should update username and clear error', () => {
      const [model] = init
      const [newModel, cmd] = update(Msg.UsernameChanged({ username: 'admin' }), model)
      expect(newModel.username).toBe('admin')
      expect(Option.isNone(newModel.error)).toBe(true)
      expect(cmd).toBe(Cmd.none)
    })

    it('should update password and clear error', () => {
      const [model] = init
      const [newModel, cmd] = update(Msg.PasswordChanged({ password: 'secret' }), model)
      expect(newModel.password).toBe('secret')
      expect(Option.isNone(newModel.error)).toBe(true)
      expect(cmd).toBe(Cmd.none)
    })

    it('should set isSubmitting on Submit', () => {
      const [model] = init
      const typed = { ...model, username: 'admin', password: 'admin' }
      const [newModel, cmd] = update(Msg.Submit(), typed)
      expect(newModel.isSubmitting).toBe(true)
      expect(Option.isNone(newModel.error)).toBe(true)
      expect(cmd).not.toBe(Cmd.none)
    })

    it('should set result on LoginSucceeded', () => {
      const [model] = init
      const session = { accessToken: 'tok', refreshToken: 'rtok', username: 'admin', permissions: ['home.view'] }
      const [newModel, cmd] = update(Msg.LoginSucceeded({ session }), {
        ...model,
        isSubmitting: true,
      })
      expect(Option.isSome(newModel.result)).toBe(true)
      expect(newModel.isSubmitting).toBe(false)
      expect(cmd).toBe(Cmd.none)
    })

    it('should set error on LoginFailed', () => {
      const [model] = init
      const [newModel, cmd] = update(
        Msg.LoginFailed({ error: { _tag: 'BadStatus' as const, status: 401, body: '' } }),
        { ...model, isSubmitting: true },
      )
      expect(Option.isSome(newModel.error)).toBe(true)
      expect(Option.isNone(newModel.result)).toBe(true)
      expect(newModel.isSubmitting).toBe(false)
      expect(cmd).toBe(Cmd.none)
    })
  })
})
