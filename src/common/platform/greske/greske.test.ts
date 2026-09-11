import { describe, it, expect } from 'vitest'
import type * as Http from 'tea-effect/Http'
import { postaviPismo } from '../../strings'
import { greskeNaPoljima, errorReport, poslovneGreske } from './index'

const badStatus = (status: number, telo: unknown): Http.HttpError => ({
  _tag: 'BadStatus',
  status,
  body: typeof telo === 'string' ? telo : JSON.stringify(telo),
})

const poslovna = (code: string, message: string, severity: 'ERROR' | 'WARNING' = 'ERROR') => ({
  type: 'BUSINESS' as const,
  code,
  messageCode: 'msg.' + code,
  message,
  severity,
})

describe('извештај о грешци', () => {
  it('мрежна грешка добија поруку коју корисник може да прочита', () => {
    expect(errorReport({ _tag: 'NetworkError', error: 'x' }).message).toContain('комуникацији')
  })

  it('400 са envelope-ом показује поруке са сервера, спојене', () => {
    const report = errorReport(
      badStatus(400, [poslovna('A', 'Редни број је заузет'), poslovna('B', 'Количина превелика')]),
    )
    expect(report.message).toBe('Редни број је заузет\nКоличина превелика')
    expect(report.severity).toBe('ERROR')
  })

  it('скуп је упозорење само ако су СВЕ грешке упозорења', () => {
    expect(errorReport(badStatus(400, [poslovna('A', 'x', 'WARNING')])).severity).toBe('WARNING')
    expect(errorReport(badStatus(400, [poslovna('A', 'x', 'WARNING'), poslovna('B', 'y', 'ERROR')])).severity).toBe(
      'ERROR',
    )
  })

  it('400 са телом које није envelope не руши, него јавља неочекиван облик', () => {
    expect(errorReport(badStatus(400, 'ovo nije json')).message).toContain('неочекиваног облика')
  })

  it('403 и 500 имају своје поруке', () => {
    expect(errorReport(badStatus(403, '')).message).toContain('Немате право')
    expect(errorReport(badStatus(500, '')).message).toContain('на серверу')
  })

  it('непознат статус улази у поруку', () => {
    expect(errorReport(badStatus(418, '')).message).toContain('418')
  })

  it('порука прати изабрано писмо', () => {
    postaviPismo('latinica')
    expect(errorReport({ _tag: 'Timeout' }).message).toBe(
      'Server nije poslao odgovor u predviđenom roku. Pokušajte ponovo.',
    )
    postaviPismo('cirilica')
  })
})

describe('пословне грешке', () => {
  it('издваја само BUSINESS из мешовитог envelope-а', () => {
    const error = badStatus(400, [
      poslovna('A', 'пословна'),
      { type: 'SYSTEM', code: 'S1', message: 'системска' },
      { type: 'PRECONDITION', message: 'предуслов' },
    ])
    expect(poslovneGreske(error).map(g => g.code)).toEqual(['A'])
  })

  it('нема их ван 400', () => {
    expect(poslovneGreske(badStatus(500, [poslovna('A', 'x')]))).toEqual([])
  })
})

describe('грешке на пољима', () => {
  it('познат код завршава на пољу, непознат остаје на форми', () => {
    const error = badStatus(400, [poslovna('REDNI_BROJ_ZAUZET', 'Заузет'), poslovna('NEPOZNAT', 'Нешто друго')])
    expect(greskeNaPoljima(error, { REDNI_BROJ_ZAUZET: 'redniBroj' })).toEqual([
      { path: ['redniBroj'], message: 'Заузет', severity: 'error' },
      { path: [], message: 'Нешто друго', severity: 'error' },
    ])
  })

  it('упозорење са сервера остаје упозорење', () => {
    const error = badStatus(400, [poslovna('A', 'Пажња', 'WARNING')])
    expect(greskeNaPoljima(error)[0].severity).toBe('warning')
  })
})
