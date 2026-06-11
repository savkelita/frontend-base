import { Either, Schema } from 'effect'
import { describe, it, expect } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import { formChanged, submit, submitted } from './msg'
import { OrderSchema, initialValues } from './model'
import type { Values } from './model'
import { init, update } from './index'

const validValues: Values = {
  reference: 'ORD-1',
  priority: 'normal',
  customer: { kind: 'person', firstName: 'Ada', lastName: 'Lovelace' },
  shipping: { street: 'Main 1', city: 'Belgrade', postalCode: '11000' },
  items: [{ sku: 'SKU-1', quantity: '2', unitPrice: '5' }],
}

describe('orders form (phase 0 prototype)', () => {
  it('FormChanged writes the whole values into the model', () => {
    const [model] = init
    const next = { ...initialValues, reference: 'ORD-9' }
    const [updated, cmd] = update(formChanged(next), model)
    expect(updated.values.reference).toBe('ORD-9')
    expect(cmd).toBe(Cmd.none)
  })

  it('Submit with invalid values flips showErrors and stays put', () => {
    const [model] = init // initialValues are invalid (empty reference, empty sku, total 0, ...)
    const [updated, cmd] = update(submit(), model)
    expect(updated.showErrors).toBe(true)
    expect(updated.submitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('Submit with valid values starts submitting and emits a command', () => {
    const [model] = init
    const ready = update(formChanged(validValues), model)[0]
    const [updated, cmd] = update(submit(), ready)
    expect(updated.submitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('Submitted clears submitting and marks submitted', () => {
    const [model] = init
    const [updated] = update(submitted(), { ...model, submitting: true })
    expect(updated.submitting).toBe(false)
    expect(updated.submitted).toBe(true)
  })

  it('decodes valid string-ish values into a typed Order (Encoded -> Type)', () => {
    const result = Schema.decodeUnknownEither(OrderSchema, { errors: 'all' })(validValues)
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      // The decoded Output is typed: quantity is a number, not the string '2'.
      expect(result.right.items[0].quantity).toBe(2)
      expect(result.right.customer.kind).toBe('person')
    }
  })

  it('rejects an items list with one invalid element', () => {
    const withBadItem: Values = {
      ...validValues,
      items: [...validValues.items, { sku: '', quantity: '0', unitPrice: '-1' }],
    }
    const result = Schema.decodeUnknownEither(OrderSchema, { errors: 'all' })(withBadItem)
    expect(Either.isLeft(result)).toBe(true)
  })
})
