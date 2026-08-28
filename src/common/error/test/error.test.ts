import { describe, expect, it } from 'vitest'
import { mapHttpError, parseErrors } from '../error'

const body = (value: unknown): string => JSON.stringify(value)

const business = {
  type: 'BUSINESS',
  code: 'PP001',
  messageCode: 'ERR_DUPLIKAT',
  message: 'Sifra vec postoji',
  severity: 'ERROR',
}

describe('parseErrors', () => {
  it('cita poslovnu gresku sa severity', () => {
    expect(parseErrors(body([business]))).toStrictEqual([business])
  })

  it('cita sistemsku gresku', () => {
    const value = { type: 'SYSTEM', code: 'SYS01', message: 'Servis nije dostupan' }
    expect(parseErrors(body([value]))).toStrictEqual([value])
  })

  it('cita precondition gresku', () => {
    const value = { type: 'PRECONDITION', message: 'Zapis je u medjuvremenu izmenjen' }
    expect(parseErrors(body([value]))).toStrictEqual([value])
  })

  it('polje van ugovora ne obara dekodovanje, samo otpada', () => {
    const value = { type: 'PRECONDITION', message: 'Zapis je u medjuvremenu izmenjen', code: 'PP002' }
    expect(parseErrors(body([value]))).toStrictEqual([{ type: 'PRECONDITION', message: value.message }])
  })

  it('cita listu mesanih tipova, redom', () => {
    const values = [business, { type: 'SYSTEM', code: 'SYS01', message: 'Pao servis' }]
    expect(parseErrors(body(values)).map(e => e.type)).toStrictEqual(['BUSINESS', 'SYSTEM'])
  })

  it('cuva WARNING kao zaseban severity', () => {
    const warning = { ...business, severity: 'WARNING' }
    const [first] = parseErrors(body([warning]))
    expect(first?.type === 'BUSINESS' && first.severity).toBe('WARNING')
  })

  it('prima poruku duzu od 255 karaktera', () => {
    const dugacka = 'x'.repeat(400)
    expect(parseErrors(body([{ ...business, message: dugacka }]))).toHaveLength(1)
  })

  // Validacija salje listu, a odbijeno ovlascenje jedan objekat; oba su ista stvar za prikaz.
  it('cita i jedan objekat, ne samo listu', () => {
    expect(parseErrors(body(business))).toStrictEqual([business])
  })

  describe('telo koje se ne razume ne obara prikaz', () => {
    it.each([
      ['prazan tekst', ''],
      ['nije JSON', '<html>502</html>'],
      ['nepoznat `type`', body([{ type: 'NESTO', message: 'x' }])],
      ['nepoznat `type`, van liste', body({ type: 'NESTO', message: 'x' })],
      ['fali obavezno polje', body([{ type: 'SYSTEM', code: 'SYS01' }])],
      ['nepoznat severity', body([{ ...business, severity: 'FATAL' }])],
    ])('%s', (_naziv, raw) => {
      expect(parseErrors(raw)).toStrictEqual([])
    })
  })
})

describe('mapHttpError', () => {
  it('400 nosi dekodovanu listu', () => {
    const error = mapHttpError({ _tag: 'BadStatus', status: 400, body: body([business]) })
    expect(error._tag === 'BadRequest' && error.errors).toStrictEqual([business])
  })

  it('401 ostaje Unauthorized, bez izmisljene liste', () => {
    const error = mapHttpError({ _tag: 'BadStatus', status: 401, body: '' })
    expect(error._tag === 'Unauthorized' && error.errors).toStrictEqual([])
  })

  // Server na 401 kaze da li je pogresna lozinka ili nedostaje pravo; ta poruka je bolja od nase.
  it('401 zadrzava poruku servera', () => {
    const odbijeno = {
      type: 'BUSINESS',
      code: 'AUTH01',
      messageCode: 'ERR_LOZINKA',
      message: 'Pogresno korisnicko ime ili lozinka',
      severity: 'ERROR',
    }
    const error = mapHttpError({ _tag: 'BadStatus', status: 401, body: body(odbijeno) })
    expect(error._tag === 'Unauthorized' && error.errors.map(e => e.message)).toStrictEqual([
      'Pogresno korisnicko ime ili lozinka',
    ])
  })

  it('mrezna greska ne pokusava da parsira telo', () => {
    expect(mapHttpError({ _tag: 'NetworkError', error: new Error('offline') })._tag).toBe('NetworkError')
  })

  it.each([
    ['BadUrl', { _tag: 'BadUrl', url: '::' } as const, 'BadRequestPayload'],
    ['Timeout', { _tag: 'Timeout' } as const, 'Timeout'],
    ['NetworkError', { _tag: 'NetworkError', error: 'x' } as const, 'NetworkError'],
    ['BadBody', { _tag: 'BadBody', error: 'x' } as const, 'BadResponse'],
    ['BadRequestBody', { _tag: 'BadRequestBody', error: 'x' } as const, 'BadRequestPayload'],
  ])('%s -> %s', (_naziv, error, ocekivano) => {
    expect(mapHttpError(error)._tag).toBe(ocekivano)
  })

  it.each([
    [400, 'BadRequest'],
    [401, 'Unauthorized'],
    [404, 'NotFound'],
    [500, 'ServerFailure'],
    [503, 'Unavailable'],
    [504, 'Timeout'],
    [418, 'UnexpectedStatus'],
  ])('status %i -> %s', (status, ocekivano) => {
    expect(mapHttpError({ _tag: 'BadStatus', status, body: '' })._tag).toBe(ocekivano)
  })
})
