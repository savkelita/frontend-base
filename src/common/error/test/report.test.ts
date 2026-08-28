import { describe, expect, it } from 'vitest'
import { ApiError, type ServerError } from '../error'
import { reportError } from '../report'

const business = (message: string, severity: 'ERROR' | 'WARNING'): ServerError => ({
  type: 'BUSINESS',
  code: 'PP001',
  messageCode: 'ERR',
  message,
  severity,
})

const badRequest = (...errors: ReadonlyArray<ServerError>) => reportError(ApiError.BadRequest({ errors }))

const text = (error: ApiError): string => reportError(error).messages.join(' ')

describe('reportError', () => {
  it('prenosi svaku serversku poruku, redom', () => {
    expect(badRequest(business('Prva', 'ERROR'), business('Druga', 'ERROR')).messages).toStrictEqual(['Prva', 'Druga'])
  })

  it('upozorenje je upozorenje samo ako su sve poruke upozorenja', () => {
    expect(badRequest(business('a', 'WARNING'), business('b', 'WARNING')).severity).toBe('WARNING')
  })

  it('jedna prava greska obara ceo skup na ERROR', () => {
    expect(badRequest(business('a', 'WARNING'), business('b', 'ERROR')).severity).toBe('ERROR')
  })

  it('sistemska greska nikad nije upozorenje, ma sta stajalo uz nju', () => {
    const sistemska: ServerError = { type: 'SYSTEM', code: 'SYS01', message: 'Pao servis' }
    expect(badRequest(business('a', 'WARNING'), sistemska).severity).toBe('ERROR')
  })

  it('400 bez razumljivog tela dobija nasu poruku, ne prazan prikaz', () => {
    const report = badRequest()
    expect(report.messages).toHaveLength(1)
    expect(report.severity).toBe('ERROR')
  })

  it.each([
    ['Unauthorized', ApiError.Unauthorized({ errors: [] })],
    ['NotFound', ApiError.NotFound()],
    ['ServerFailure', ApiError.ServerFailure()],
    ['Unavailable', ApiError.Unavailable()],
    ['Timeout', ApiError.Timeout()],
    ['NetworkError', ApiError.NetworkError()],
    ['BadResponse', ApiError.BadResponse()],
    ['BadRequestPayload', ApiError.BadRequestPayload()],
    ['UnexpectedStatus', ApiError.UnexpectedStatus({ status: 418 })],
  ])('%s ima tacno jednu poruku i nikad nije upozorenje', (_naziv, error) => {
    const report = reportError(error)
    expect(report.messages).toHaveLength(1)
    expect(report.messages[0]).not.toBe('')
    expect(report.severity).toBe('ERROR')
  })

  it('svaki slucaj daje razlicit tekst — nijedan se ne stapa sa drugim', () => {
    const svi = [
      ApiError.Unauthorized({ errors: [] }),
      ApiError.NotFound(),
      ApiError.ServerFailure(),
      ApiError.Unavailable(),
      ApiError.Timeout(),
      ApiError.NetworkError(),
      ApiError.BadResponse(),
      ApiError.BadRequestPayload(),
    ].map(text)
    expect(new Set(svi).size).toBe(svi.length)
  })

  it('nepoznat status stoji u poruci', () => {
    expect(text(ApiError.UnexpectedStatus({ status: 418 }))).toContain('418')
  })
})
