import { describe, it, expect } from 'vitest'
import { Either } from 'effect'
import { normalizujPrefiks, procitaj } from './index'

// -------------------------------------------------------------------------------------
// Конфигурација мора да пукне гласно
// -------------------------------------------------------------------------------------
//
// Тиха подразумевана вредност је овде најгора могућа: апликација се подигне, тражи backend
// на погрешном месту, а узрок се тражи данима. Зато тестови тврде да сваки неисправан улаз
// иде на леву страну.

const ispravna = { basePath: '/Magacin1', apiUrl: '/Magacin1', pismo: 'cirilica', environment: 'production' }

describe('procitaj', () => {
  it('прихвата исправну конфигурацију', () => {
    expect(Either.isRight(procitaj(ispravna))).toBe(true)
  })

  it('без конфигурације иде на леву страну, не на подразумевану вредност', () => {
    expect(Either.isLeft(procitaj(undefined))).toBe(true)
    expect(Either.isLeft(procitaj(null))).toBe(true)
  })

  it('поље које недостаје руши читање', () => {
    expect(Either.isLeft(procitaj({ basePath: '/', pismo: 'cirilica', environment: 'test' }))).toBe(true)
  })

  it('непознато писмо руши читање', () => {
    expect(Either.isLeft(procitaj({ ...ispravna, pismo: 'glagoljica' }))).toBe(true)
  })

  it('instanceName сме да изостане', () => {
    expect(Either.isRight(procitaj({ ...ispravna, instanceName: 'Ink2' }))).toBe(true)
  })
})

describe('normalizujPrefiks', () => {
  it('корен даје празан префикс, да надовезивање не даје двоструку косу црту', () => {
    expect(normalizujPrefiks('/')).toBe('')
    expect(normalizujPrefiks('')).toBe('')
    expect(normalizujPrefiks('   ')).toBe('')
  })

  it('додаје водећу и скида завршну косу црту', () => {
    expect(normalizujPrefiks('Magacin1')).toBe('/Magacin1')
    expect(normalizujPrefiks('/Magacin1/')).toBe('/Magacin1')
    expect(normalizujPrefiks('//Magacin1//')).toBe('/Magacin1')
  })

  it('чува вишесегментни префикс', () => {
    expect(normalizujPrefiks('/apps/Magacin1/')).toBe('/apps/Magacin1')
  })
})
