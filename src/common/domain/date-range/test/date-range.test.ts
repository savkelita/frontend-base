import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import { vForm, type Form as DateRangeForm } from '../index'

const vRange = () => Schema.Struct({ opseg: Schema.NullOr(vForm) })

const valid = (opseg: DateRangeForm | null): boolean => Form.validate(vRange, { opseg }).isValid

const day = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

describe('opseg datuma nista ne trazi od korisnika', () => {
  it('prazan opseg je ispravan', () => {
    expect(valid(null)).toBe(true)
    expect(valid([null, null])).toBe(true)
  })

  it('jedan kraj je ispravan opseg', () => {
    expect(valid([day(2026, 3, 15), null])).toBe(true)
    expect(valid([null, day(2026, 3, 15)])).toBe(true)
  })

  it('obrnut opseg je ispravan', () => {
    expect(valid([day(2026, 3, 20), day(2026, 3, 15)])).toBe(true)
  })

  it('popunjen opseg je ispravan', () => {
    expect(valid([day(2026, 3, 15), day(2026, 3, 20)])).toBe(true)
  })
})
