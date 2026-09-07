import { describe, it, expect } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import { Msg } from './msg'
import * as Delete from './index'

describe('products/delete', () => {
  it('Confirm starts deleting and issues the delete command (Active)', () => {
    const [model, cmd, outcome] = Delete.update(5, Msg.Confirm(), Delete.init)
    expect(model.deleting).toBe(true)
    expect(outcome).toBe('Active')
    expect(cmd).not.toBe(Cmd.none)
  })

  it('Deleted signals the host to close + refresh', () => {
    const [, , outcome] = Delete.update(5, Msg.Deleted(), Delete.init)
    expect(outcome).toBe('Deleted')
  })

  it('Cancel signals the host to close', () => {
    const [, cmd, outcome] = Delete.update(5, Msg.Cancel(), Delete.init)
    expect(outcome).toBe('Cancelled')
    expect(cmd).toBe(Cmd.none)
  })
})
