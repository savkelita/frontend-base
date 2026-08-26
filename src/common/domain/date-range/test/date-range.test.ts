import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import { vForm, type Form as DateRangeForm } from '../index'

const vOpseg = () => Schema.Struct({ opseg: Schema.NullOr(vForm) })

const validan = (opseg: DateRangeForm | null): boolean => Form.validate(vOpseg, { opseg }).isValid

const dan = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

// Operator se bira po popunjenosti, pa opseg nema sta da odbije; ovo drzi tu odluku.
describe('opseg datuma nista ne trazi od korisnika', () => {
  it('prazan opseg je ispravan', () => {
    expect(validan(null)).toBe(true)
    expect(validan([null, null])).toBe(true)
  })

  it('jedan kraj je ispravan opseg', () => {
    expect(validan([dan(2026, 3, 15), null])).toBe(true)
    expect(validan([null, dan(2026, 3, 15)])).toBe(true)
  })

  // Redosled odlucuje BE tako sto na obrnut opseg ne vrati nista.
  it('obrnut opseg je ispravan', () => {
    expect(validan([dan(2026, 3, 20), dan(2026, 3, 15)])).toBe(true)
  })

  it('popunjen opseg je ispravan', () => {
    expect(validan([dan(2026, 3, 15), dan(2026, 3, 20)])).toBe(true)
  })
})
