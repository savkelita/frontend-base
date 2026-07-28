import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import { Form } from '..'

const ctx = { deps: {}, mode: 'Create' as const }

const field = Form.asyncValidated(Form.code30({ label: 'Šifra' }), {
  check: () => Http.get('/x', Http.expectJson(S.Struct({ available: S.Boolean }))),
  toIssues: (r: { available: boolean }) =>
    r.available ? [] : [{ path: ['x'], message: 'Zauzeto', severity: 'error' as const }],
  debounceMs: 300,
})

describe('forms/asyncValidated', () => {
  it('a value change marks Validating and schedules a (debounced) check', () => {
    const [s0] = field.init('')
    const [s1, cmd] = field.update({ _tag: 'Inner', msg: 'ABC' }, s0, ctx)
    expect(field.validating?.(s1)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('an empty value does not validate', () => {
    const [s0] = field.init('')
    const [s1] = field.update({ _tag: 'Inner', msg: '' }, s0, ctx)
    expect(field.validating?.(s1)).toBe(false)
    expect(field.issues?.(s1)).toEqual([])
  })

  it('Checked with the current seq stores the issues', () => {
    const [s0] = field.init('')
    const [s1] = field.update({ _tag: 'Inner', msg: 'ABC' }, s0, ctx)
    const [s2] = field.update(
      { _tag: 'Checked', seq: 1, issues: [{ path: ['x'], message: 'Zauzeto', severity: 'error' }] },
      s1,
      ctx,
    )
    expect(field.validating?.(s2)).toBe(false)
    expect(field.issues?.(s2)).toEqual([{ path: ['x'], message: 'Zauzeto', severity: 'error' }])
  })

  it('drops a stale Checked (older seq)', () => {
    const [s0] = field.init('')
    const [s1] = field.update({ _tag: 'Inner', msg: 'ABC' }, s0, ctx)
    const [s2] = field.update(
      { _tag: 'Checked', seq: 999, issues: [{ path: ['x'], message: 'x', severity: 'error' }] },
      s1,
      ctx,
    )
    expect(field.issues?.(s2)).toEqual([])
  })

  it('forwards the value of the inner field', () => {
    const [s0] = field.init('')
    const [s1] = field.update({ _tag: 'Inner', msg: 'ABC' }, s0, ctx)
    expect(field.value(s1)).toBe('ABC')
  })
})
