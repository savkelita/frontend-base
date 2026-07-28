import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import { toQuery, contains, response } from '.'

describe('common/pretraga', () => {
  describe('toQuery', () => {
    it('flattens paging + criteria (tuples repeat the key)', () => {
      const q = toQuery({ limit_: 20, offset_: 0, criteria: { unetaVrednost: contains('ab'), magacinID: 5 } })
      expect(q).toBe('limit_=20&offset_=0&unetaVrednost=contains&unetaVrednost=ab&magacinID=5')
    })

    it('omits undefined criteria and empty paging', () => {
      const q = toQuery({ criteria: { unetaVrednost: contains(''), id: undefined } })
      expect(q).toBe('unetaVrednost=contains&unetaVrednost=')
    })

    it('serializes order_ as attribute/direction pairs', () => {
      const q = toQuery({ criteria: {}, order_: [['ime', 'ASC']] })
      expect(q).toBe('order_=ime&order_=ASC')
    })
  })

  describe('response', () => {
    it('decodes a PretragaResponse of the given result type', () => {
      const Result = S.Struct({ id: S.Number, ime: S.String })
      const decoded = S.decodeUnknownSync(response(Result))({
        total_: 1,
        offset_: 0,
        result: [{ id: 7, ime: 'Ana' }],
      })
      expect(decoded.total_).toBe(1)
      expect(decoded.result).toEqual([{ id: 7, ime: 'Ana' }])
    })
  })
})
