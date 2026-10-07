import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import { PATTERN, toDigits, vForm, type Form as TelefonForm } from '../index'

const vPhone = () => Schema.Struct({ telefon: vForm })

const messages = (telefon: TelefonForm): ReadonlyArray<string> =>
  Form.visibleIssues(vPhone, { telefon }, true).map(issue => issue.message)

describe('pravilo', () => {
  it('prima 7 i 8 cifara posle pozivnog', () => {
    expect(PATTERN.test('38161234567')).toBe(true)
    expect(PATTERN.test('381612345678')).toBe(true)
  })

  it('odbija sve ostalo', () => {
    expect(PATTERN.test('3816123456')).toBe(false)
    expect(PATTERN.test('3816123456789')).toBe(false)
    expect(PATTERN.test('0641234567')).toBe(false)
    expect(PATTERN.test('3816123456a')).toBe(false)
    expect(PATTERN.test('38161234 567')).toBe(false)
  })

  it('prazno polje trazi podatak', () => {
    expect(messages(null)).toStrictEqual(['Podatak je obavezan'])
  })

  it('nepotpun broj kaze koliko cifara fali', () => {
    expect(messages('3816123')).toStrictEqual(['Broj mora imati 7 ili 8 cifara posle +381 6'])
  })

  it('ispravan broj nema zamerki', () => {
    expect(messages('38161234567')).toStrictEqual([])
  })
})

describe('unos', () => {
  it('propusta samo cifre', () => {
    expect(toDigits('12-34 56')).toBe('123456')
    expect(toDigits('abc')).toBe('')
  })

  it('kucanje se ne dira', () => {
    expect(toDigits('4')).toBe('4')
    expect(toDigits('41234567')).toBe('41234567')
    expect(toDigits('06381612')).toBe('06381612')
  })

  it('nalepljen ceo broj gubi pozivni', () => {
    expect(toDigits('+381 64 123 4567')).toBe('41234567')
    expect(toDigits('381641234567')).toBe('41234567')
    expect(toDigits('0641234567')).toBe('41234567')
    expect(toDigits('641234567')).toBe('41234567')
  })

  it('visak cifara otpada', () => {
    expect(toDigits('412345678901')).toBe('41234567')
  })
})
