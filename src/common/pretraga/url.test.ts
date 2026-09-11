import { describe, it, expect } from 'vitest'
import type { Sort } from '../platform'
import { kriterijumiIzQuery, sortIzTeksta, sortUTekst, stanjeIzQuery, stanjeUQuery } from './url'

type Kolona = 'sifra' | 'naziv' | 'stanje'
const KOLONE: ReadonlyArray<Kolona> = ['sifra', 'naziv', 'stanje']

describe('сорт у URL-у', () => {
  it('пише се као један параметар', () => {
    expect(
      sortUTekst<Kolona>([
        ['stanje', 'ASC'],
        ['sifra', 'DESC'],
      ]),
    ).toBe('stanje:asc,sifra:desc')
  })

  it('чита се назад у исти облик', () => {
    expect(sortIzTeksta('stanje:asc,sifra:desc', KOLONE)).toEqual([
      ['stanje', 'ASC'],
      ['sifra', 'DESC'],
    ])
  })

  it('непозната колона се одбацује, остатак преживљава', () => {
    expect(sortIzTeksta('izmisljena:asc,sifra:desc', KOLONE)).toEqual([['sifra', 'DESC']])
  })

  it('неисправан смер се одбацује', () => {
    expect(sortIzTeksta('sifra:gore', KOLONE)).toEqual([])
  })

  it('празно даје празан сорт', () => {
    expect(sortIzTeksta(undefined, KOLONE)).toEqual([])
  })
})

describe('критеријуми', () => {
  it('поновљен кључ се чита као н-торка — исто као на жици', () => {
    const params = new URLSearchParams('sifra=contains&sifra=ABC&stanje=AKTIVAN')
    expect(kriterijumiIzQuery(params)).toEqual({ sifra: ['contains', 'ABC'], stanje: 'AKTIVAN' })
  })

  it('sort и offset нису критеријуми', () => {
    const params = new URLSearchParams('sort=sifra:asc&offset=20&naziv=X')
    expect(kriterijumiIzQuery(params)).toEqual({ naziv: 'X' })
  })
})

describe('цело стање', () => {
  const stanje = {
    criteria: { sifra: ['contains', 'ABC'] as const, stanje: 'AKTIVAN' },
    sort: [['stanje', 'ASC']] as ReadonlyArray<Sort<Kolona>>,
    offset: 20,
  }

  it('пише се и чита без губитка', () => {
    const query = stanjeUQuery(stanje)
    expect(query).toBe('sifra=contains&sifra=ABC&stanje=AKTIVAN&sort=stanje%3Aasc&offset=20')
    expect(stanjeIzQuery<Kolona>(query, KOLONE)).toEqual(stanje)
  })

  it('прва страна и празан сорт не прљају URL', () => {
    expect(stanjeUQuery({ criteria: {}, sort: [], offset: 0 })).toBe('')
  })

  it('празне вредности критеријума испадају', () => {
    expect(stanjeUQuery({ criteria: { a: '', b: [], c: 'x' }, sort: [], offset: 0 })).toBe('c=x')
  })

  it('без sort параметра важи почетни сорт — и он сме имати више колона', () => {
    const podrazumevani: ReadonlyArray<Sort<Kolona>> = [
      ['stanje', 'ASC'],
      ['sifra', 'DESC'],
    ]
    expect(stanjeIzQuery<Kolona>('naziv=X', KOLONE, podrazumevani).sort).toEqual(podrazumevani)
  })

  it('чим sort стоји у URL-у, почетни више не важи', () => {
    const podrazumevani: ReadonlyArray<Sort<Kolona>> = [['stanje', 'ASC']]
    expect(stanjeIzQuery<Kolona>('sort=naziv:desc', KOLONE, podrazumevani).sort).toEqual([['naziv', 'DESC']])
  })

  it('бесмислен offset се своди на прву страну', () => {
    expect(stanjeIzQuery<Kolona>('offset=-5', KOLONE).offset).toBe(0)
    expect(stanjeIzQuery<Kolona>('offset=abc', KOLONE).offset).toBe(0)
  })
})
