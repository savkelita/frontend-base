import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import { java } from '../profile/java'
import { sTekstPredikat } from '../contract'
import { makeApi } from './index'

// -------------------------------------------------------------------------------------
// Рута прима шеме, не типове
// -------------------------------------------------------------------------------------
//
// Оно што рута каже да прима мора да важи и у извршавању, не само у компајлеру: критеријуми
// стижу из адресне линије, коју корисник сме да откуца руком.

const api = makeApi(java, '/api/sifarnik')

const sRed = S.Struct({ id: S.Number, sifra: S.String })
const sKriterijumi = S.Struct({ sifra: S.optional(sTekstPredikat), grupaArtiklaID: S.optional(S.Number) })
const sKolone = S.Literal('sifra', 'naziv')

const pretraziArtikal = api.pretraga('pretraziArtikal', sRed, sKriterijumi, sKolone)

const upit = (url: string) => new URL(url, 'http://x').searchParams

describe('pretraga', () => {
  it('колоне за сортирање долазе из шеме, не из напоредног списка', () => {
    expect(pretraziArtikal.kolone).toEqual(['sifra', 'naziv'])
  })

  it('шаље критеријуме које рута признаје', () => {
    const params = upit(pretraziArtikal({ criteria: { sifra: ['contains', 'ART'], grupaArtiklaID: 7 } }).url)
    expect(params.getAll('sifra')).toEqual(['contains', 'ART'])
    expect(params.get('grupaArtiklaID')).toBe('7')
  })

  it('критеријум који рута не признаје испада — руком дотеран URL не иде серверу', () => {
    const zahtev = { criteria: { sifra: ['contains', 'ART'], izmisljeno: 'x' } } as unknown as Parameters<
      typeof pretraziArtikal
    >[0]
    const params = upit(pretraziArtikal(zahtev).url)
    expect(params.getAll('sifra')).toEqual(['contains', 'ART'])
    expect(params.has('izmisljeno')).toBe(false)
  })

  it('сорт иде кроз профил у Java облику', () => {
    const params = upit(pretraziArtikal({ criteria: {}, sort: [['sifra', 'DESC']] }).url)
    expect(params.getAll('order_')).toEqual(['sifra', 'DESC'])
  })
})

describe('dajInfo', () => {
  const sParametri = S.Struct({ artikalID: S.Number })
  const dajArtikal = api.dajInfo('dajArtikal', sParametri, sRed)

  it('параметар иде у путању, као на затеченим пројектима', () => {
    expect(dajArtikal({ artikalID: 5 }).url).toBe('/api/sifarnik/dajArtikal/5')
  })

  it('редослед сегмената долази из шеме, не са места позива', () => {
    const dvaParametra = api.dajInfo('dajNesto', S.Struct({ prvi: S.Number, drugi: S.Number }), sRed)
    // Кључеви су написани обрнуто; путања их и даље ређа онако како шема каже.
    expect(dvaParametra({ drugi: 2, prvi: 1 }).url).toBe('/api/sifarnik/dajNesto/1/2')
  })
})

describe('combo', () => {
  const sComboKriterijumi = S.Struct({ id: S.optional(S.Number), artikalID: S.optional(S.Number) })
  const izvor = api.combo('pretraziArtikalCombo', sRed, sComboKriterijumi)

  it('откуцани текст уписује профил, не позивалац', () => {
    const params = upit(izvor.request({}, 'mle', 0).url)
    expect(params.getAll('unetaVrednost')).toEqual(['contains', 'mle'])
  })

  it('шаље критеријуме које извор признаје', () => {
    const params = upit(izvor.request({ artikalID: 3 }, '', 0).url)
    expect(params.get('artikalID')).toBe('3')
  })

  it('критеријум који извор не признаје испада', () => {
    const params = upit(izvor.request({ izmisljeno: 1 } as never, '', 0).url)
    expect(params.has('izmisljeno')).toBe(false)
  })

  it('страничење иде кроз редовни померај', () => {
    const params = upit(izvor.request({}, '', 20).url)
    expect(params.get('offset_')).toBe('20')
    expect(params.get('limit_')).toBe('10')
  })
})

describe('komanda', () => {
  const sCmd = S.Struct({ id: S.Number })

  it('без одговора шаље POST на операцију', () => {
    const zahtev = api.komanda('obrisiArtikal', sCmd)({ id: 1 })
    expect(zahtev.method).toBe('POST')
    expect(zahtev.url).toBe('/api/sifarnik/obrisiArtikal')
  })

  it('са одговором декодује оно што сервер враћа', () => {
    const zahtev = api.komanda('kreirajArtikal', sCmd, sRed)({ id: 1 })
    expect(zahtev.expect._tag).toBe('ExpectJson')
  })
})
