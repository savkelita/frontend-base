import { describe, it, expect, afterEach } from 'vitest'
import { S, kalendarskiTekstovi, postaviPismo, suprotno, t, trenutnoPismo, uLatinicu } from './index'

// -------------------------------------------------------------------------------------
// Писмо мења цео екран, не поједине текстове
// -------------------------------------------------------------------------------------
//
// Правило иза свега: каталог постоји само ћирилицом. Ако се латиница негде укуца ручно,
// прекидач тај текст неће дирати — зато први тест прегледа цео каталог.

afterEach(() => postaviPismo('cirilica'))

const svaSlova = (vrednost: unknown): ReadonlyArray<string> =>
  typeof vrednost === 'string'
    ? [vrednost]
    : typeof vrednost === 'object' && vrednost !== null
      ? Object.values(vrednost).flatMap(svaSlova)
      : []

// Властита имена се не пресловљавају ни у једном писму, па су изузета из провере.
const IMENA = ['frontend-base', 'tea-effect']

const bezDozvoljenog = (tekst: string): string =>
  IMENA.reduce((acc, ime) => acc.split(ime).join(''), tekst).replace(/[{][a-zA-Z]+[}]/g, '')

describe('каталог', () => {
  it('нема ниједног латиничног слова — иначе прекидач не би важио за све', () => {
    const sumnjivi = svaSlova(S).filter(tekst => /[a-zA-ZčćžšđČĆŽŠĐ]/.test(bezDozvoljenog(tekst)))
    expect(sumnjivi).toEqual([])
  })
})

describe('t', () => {
  it('ћирилица враћа извор нетакнут', () => {
    postaviPismo('cirilica')
    expect(t(S.opste.sacuvaj)).toBe('Сачувај')
  })

  it('латиница преводи', () => {
    postaviPismo('latinica')
    expect(t(S.opste.sacuvaj)).toBe('Sačuvaj')
  })

  it('прекидач важи и за текстове написане пре њега', () => {
    postaviPismo('latinica')
    expect(t(S.lista.nemaRezultata)).toBe(uLatinicu(S.lista.nemaRezultata))
  })
})

describe('suprotno', () => {
  it('мења писмо и враћа се на почетно', () => {
    expect(suprotno('cirilica')).toBe('latinica')
    expect(suprotno(suprotno('cirilica'))).toBe('cirilica')
  })
})

describe('kalendarskiTekstovi', () => {
  it('месеци прате изабрано писмо', () => {
    postaviPismo('cirilica')
    expect(kalendarskiTekstovi().months[0]).toBe('јануар')
    postaviPismo('latinica')
    expect(kalendarskiTekstovi().months[0]).toBe('januar')
  })

  it('недеља стоји на нултом месту, како Fluent очекује', () => {
    expect(kalendarskiTekstovi().days).toHaveLength(7)
    expect(kalendarskiTekstovi().days[0]).toBe('недеља')
  })

  it('трећи месец пише се исто у оба писма, али остали не', () => {
    postaviPismo('latinica')
    expect(kalendarskiTekstovi().shortMonths[2]).toBe('mar')
    expect(kalendarskiTekstovi().shortMonths[7]).toBe('avg')
  })
})

describe('trenutnoPismo', () => {
  it('прати последње постављено', () => {
    postaviPismo('latinica')
    expect(trenutnoPismo()).toBe('latinica')
  })
})
