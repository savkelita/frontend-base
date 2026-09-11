import { describe, it, expect } from 'vitest'
import { Effect, Schema as S } from 'effect'
import type { PretragaRequest } from '../contract'
import { java } from './java'
import { dotnet } from './dotnet'
import type { BackendProfile } from './index'

// -------------------------------------------------------------------------------------
// Профил је једино место где се грешка тихо шири на све модуле
// -------------------------------------------------------------------------------------
//
// Зато тестови тврде *дословaн* query string. Грешка у паковању сорта — размак који није
// `+`, зарез који није `%2C`, смер великим словима — не види се ни у једном типу.

const Red = S.Struct({ id: S.Number, naziv: S.String })

const zahtev: PretragaRequest = {
  limit: 20,
  offset: 0,
  criteria: { stanje: 'AKTIVAN' },
  sort: [
    ['stanje', 'ASC'],
    ['datumOtpremnice', 'DESC'],
  ],
}

const dekoduj = (profile: BackendProfile, telo: unknown) => Effect.runSync(S.decodeUnknown(profile.pretraga(Red))(telo))

describe('java профил', () => {
  it('страничење носи доње црте', () => {
    expect(java.query({ limit: 20, offset: 40, criteria: {} })).toBe('limit_=20&offset_=40')
  })

  it('сорт је поновљен параметар у коме редослед носи значење', () => {
    expect(java.query(zahtev)).toBe(
      'limit_=20&offset_=0&stanje=AKTIVAN&order_=stanje&order_=ASC&order_=datumOtpremnice&order_=DESC',
    )
  })

  it('н-торка критеријума се понавља под истим кључем', () => {
    expect(java.query({ criteria: { unetaVrednost: ['contains', 'mle'] } })).toBe(
      'unetaVrednost=contains&unetaVrednost=mle',
    )
  })

  it('путања има три сегмента — useCase се игнорише', () => {
    expect(java.url('/api/otpremnica', null, 'pretraziOtpremnica')).toBe('/api/otpremnica/pretraziOtpremnica')
    expect(java.url('/api/otpremnica', 'nesto', 'pretraziOtpremnica')).toBe('/api/otpremnica/pretraziOtpremnica')
  })

  it('одговор { total_, offset_, result } постаје неутрални', () => {
    expect(dekoduj(java, { total_: 3, offset_: 0, result: [{ id: 1, naziv: 'A' }] })).toEqual({
      total: 3,
      offset: 0,
      podaci: [{ id: 1, naziv: 'A' }],
    })
  })

  it('текст у combou иде кроз универзални критеријум са оператором', () => {
    expect(java.comboTekst('naziv', 'mle')).toEqual({ unetaVrednost: ['contains', 'mle'] })
  })
})

describe('dotnet профил', () => {
  it('страничење је без доњих црта', () => {
    expect(dotnet.query({ limit: 20, offset: 40, criteria: {} })).toBe('limit=20&offset=40')
  })

  it('сорт је један параметар: размак као +, зарез као %2C, смер малим словима', () => {
    expect(dotnet.query(zahtev)).toBe('limit=20&offset=0&stanje=AKTIVAN&sort=stanje+asc%2CdatumOtpremnice+desc')
  })

  it('путања има додатни сегмент за useCase', () => {
    expect(dotnet.url('/api/prm/web/prm', 'pretragaPredmet', 'pretraziPredmet')).toBe(
      '/api/prm/web/prm/pretragaPredmet/pretraziPredmet',
    )
  })

  it('одговор { total, offset, limit, podaci } постаје неутрални, limit испада', () => {
    expect(dekoduj(dotnet, { total: 3, offset: 0, limit: 20, podaci: [{ id: 1, naziv: 'A' }] })).toEqual({
      total: 3,
      offset: 0,
      podaci: [{ id: 1, naziv: 'A' }],
    })
  })

  it('текст у combou иде у поље које combo именује, без оператора', () => {
    expect(dotnet.comboTekst('naziv', 'mle')).toEqual({ naziv: 'mle' })
  })
})

describe('оба профила', () => {
  it('без сорта нема параметра за сорт', () => {
    expect(java.query({ criteria: {} })).toBe('')
    expect(dotnet.query({ criteria: {} })).toBe('')
  })

  it('иста декларација даје исти неутрални одговор из два жичана облика', () => {
    const izJave = dekoduj(java, { total_: 1, offset_: null, result: [{ id: 7, naziv: 'X' }] })
    const izDotneta = dekoduj(dotnet, { total: 1, offset: 0, limit: 10, podaci: [{ id: 7, naziv: 'X' }] })
    expect(izJave.podaci).toEqual(izDotneta.podaci)
    expect(izJave.total).toBe(izDotneta.total)
  })
})
