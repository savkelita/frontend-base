import { FastCheck } from 'effect'
import { describe, expect, it } from 'vitest'
import { sameRequest, toQuery, withQuery, type Criteria, type PretragaRequest } from '../request'

const request = <C extends Criteria>(
  criteria: C = {} as C,
  rest: Partial<Omit<PretragaRequest<C, string>, 'criteria'>> = {},
): PretragaRequest<C, string> => ({ criteria, order_: [], ...rest })

describe('toQuery', () => {
  it('ne salje nista za prazan upit — tako se trazi VRATI SVE', () => {
    expect(toQuery(request())).toBe('')
  })

  it('salje stranu kao limit_ i offset_', () => {
    expect(toQuery(request({}, { limit_: 10, offset_: 20 }))).toBe('limit_=10&offset_=20')
  })

  it('propusta -1 kao offset, jer je to zahtev za poslednju stranu', () => {
    expect(toQuery(request({}, { limit_: 10, offset_: -1 }))).toBe('limit_=10&offset_=-1')
  })

  it('salje sortiranje kao par ponovljenih order_ kljuceva', () => {
    expect(toQuery(request({}, { order_: [['naziv', 'ASC']] }))).toBe('order_=naziv&order_=ASC')
  })

  it('salje vise sortiranja, redom', () => {
    expect(
      toQuery(
        request(
          {},
          {
            order_: [
              ['naziv', 'ASC'],
              ['datum', 'DESC'],
            ],
          },
        ),
      ),
    ).toBe('order_=naziv&order_=ASC&order_=datum&order_=DESC')
  })

  it('ponavlja isti kljuc — prvo operator, pa vrednost', () => {
    expect(toQuery(request({ unetaVrednost: ['contains', 'Beo'] }))).toBe('unetaVrednost=contains&unetaVrednost=Beo')
  })

  it('salje vise vrednosti za `in`', () => {
    expect(toQuery(request({ status: ['in', 'A', 'B'] }))).toBe('status=in&status=A&status=B')
  })

  it('salje goli broj kad kriterijum nema operator', () => {
    expect(toQuery(request({ kategorijaID: 3 }))).toBe('kategorijaID=3')
  })

  it('preskace kriterijum koji nije popunjen', () => {
    expect(toQuery(request({ ime: undefined, prezime: ['contains', 'Peric'] }))).toBe('prezime=contains&prezime=Peric')
  })

  it('salje lop_ samo kad je zadat', () => {
    expect(toQuery(request({ a: '1' }, { lop_: 'OR' }))).toBe('lop_=OR&a=1')
    expect(toQuery(request({ a: '1' }))).toBe('a=1')
  })

  it('enkoduje vrednost koja bi inace pokvarila upit', () => {
    expect(toQuery(request({ naziv: 'A&B=C' }))).toBe('naziv=A%26B%3DC')
  })
})

describe('withQuery', () => {
  it('ne dodaje upitnik kad nema sta da se posalje', () => {
    expect(withQuery('/vozaci', request())).toBe('/vozaci')
  })

  it('dodaje upitnik na cist URL', () => {
    expect(withQuery('/vozaci', request({}, { limit_: 10 }))).toBe('/vozaci?limit_=10')
  })
})

describe('sameRequest', () => {
  it('isti zahtev je isti i kad su objekti razliciti', () => {
    expect(sameRequest(request({ ime: ['contains', 'Pera'] }), request({ ime: ['contains', 'Pera'] }))).toBe(true)
  })

  it('druga strana nije isti zahtev', () => {
    expect(sameRequest(request({}, { offset_: 0 }), request({}, { offset_: 100 }))).toBe(false)
  })

  it('drugo sortiranje nije isti zahtev', () => {
    expect(sameRequest(request({}, { order_: [['ime', 'ASC']] }), request({}, { order_: [['ime', 'DESC']] }))).toBe(
      false,
    )
  })

  it('sortiranje po drugom polju nije isti zahtev', () => {
    expect(sameRequest(request({}, { order_: [['ime', 'ASC']] }), request({}, { order_: [['prezime', 'ASC']] }))).toBe(
      false,
    )
  })

  it('bez sortiranja nije isto sto i sa sortiranjem', () => {
    expect(sameRequest(request(), request({}, { order_: [['ime', 'ASC']] }))).toBe(false)
  })

  // Ovde referenca greasi: poredi stranu i sortiranje, a kriterijum ne.
  it('drugi kriterijum nije isti zahtev', () => {
    expect(sameRequest(request({ ime: ['contains', 'Pera'] }), request({ ime: ['contains', 'Mika'] }))).toBe(false)
  })

  it('kriterijum koji je nestao nije isti zahtev', () => {
    expect(sameRequest(request({ ime: ['contains', 'Pera'] }), request({}))).toBe(false)
  })

  it('nepopunjen kriterijum se ponasa kao da ga nema', () => {
    expect(sameRequest(request({ ime: undefined }), request({}))).toBe(true)
  })
})

const POLJA = ['ime', 'prezime', 'email', 'stanje', 'kategorijaID'] as const

const vrednost = FastCheck.oneof(
  FastCheck.string(),
  FastCheck.integer(),
  FastCheck.array(FastCheck.oneof(FastCheck.string(), FastCheck.integer()), { minLength: 1, maxLength: 3 }),
)

const kriterijum = FastCheck.dictionary(FastCheck.constantFrom(...POLJA), vrednost, { maxKeys: POLJA.length })

const zahtev = kriterijum.map(criteria => request(criteria as Criteria))

const parovi = (query: string): ReadonlyArray<string> => (query === '' ? [] : query.split('&').toSorted())

describe('svojstva', () => {
  it('zahtev je isti sam sebi', () => {
    FastCheck.assert(
      FastCheck.property(zahtev, a => {
        expect(sameRequest(a, a)).toBe(true)
      }),
    )
  })

  // Kriterijum iz adrese nema kljuc, a kriterijum iz filtera ga ima sa undefined.
  // Ta dva oblika se sudaraju na svakoj pretrazi i moraju da znace isto.
  it('odsutan kljuc i undefined su isti zahtev', () => {
    FastCheck.assert(
      FastCheck.property(zahtev, a => {
        const prazni = Object.fromEntries(POLJA.filter(p => !(p in a.criteria)).map(p => [p, undefined]))
        const b = request({ ...a.criteria, ...prazni })
        expect(sameRequest(a, b)).toBe(true)
        expect(toQuery(a)).toBe(toQuery(b))
      }),
    )
  })

  // toQuery ide redom upisa, pa niz nije isti string — ali jeste isti upit.
  it('redosled kljuceva ne menja zahtev ni parametre', () => {
    FastCheck.assert(
      FastCheck.property(zahtev, a => {
        const b = request(Object.fromEntries(Object.entries(a.criteria).toReversed()))
        expect(sameRequest(a, b)).toBe(true)
        expect(parovi(toQuery(a))).toStrictEqual(parovi(toQuery(b)))
      }),
    )
  })
})
