import { Chunk, Effect, Either, Option, Schema, Stream } from 'effect'
import * as Http from 'tea-effect/Http'
import { afterEach, describe, expect, it } from 'vitest'
import { expectNoContent, get, readCookie, withSession } from '../request'

describe('citanje kolacica', () => {
  it('nalazi vrednost medju vise kolacica', () => {
    expect(readCookie('XSRF-TOKEN', 'a=1; XSRF-TOKEN=abc; b=2')).toStrictEqual(Option.some('abc'))
  })

  it('trpi razmake oko imena i vrednosti', () => {
    expect(readCookie('XSRF-TOKEN', '  XSRF-TOKEN = abc  ')).toStrictEqual(Option.some('abc'))
  })

  it('dekoduje procentualno kodiranu vrednost', () => {
    expect(readCookie('XSRF-TOKEN', 'XSRF-TOKEN=a%2Bb')).toStrictEqual(Option.some('a+b'))
  })

  it('ne mesa slicna imena', () => {
    expect(readCookie('TOKEN', 'XSRF-TOKEN=abc')).toStrictEqual(Option.none())
  })

  it('prazan kolacic nije vrednost', () => {
    expect(readCookie('XSRF-TOKEN', '')).toStrictEqual(Option.none())
  })

  it('propusta vrednost koja sadrzi znak jednakosti', () => {
    expect(readCookie('t', 't=a=b')).toStrictEqual(Option.some('a=b'))
  })
})

describe('zahtev sa sesijom', () => {
  const request = get('/api/x', Http.expectJson(Schema.Struct({ a: Schema.Number })))

  it('salje kolacice, jer sesija stize kroz njih', () => {
    expect(request.withCredentials).toBe(true)
  })

  // Bez kolacica nema sta da se posalje; zaglavlje se tada izostavlja umesto da bude prazno.
  it('ne izmislja XSRF zaglavlje kad kolacica nema', () => {
    expect(request.headers.find(h => h.name === 'X-XSRF-TOKEN')).toBeUndefined()
  })

  it('ne dira zahtev koji je vec imao zaglavlja', () => {
    const withHeader = { ...request, headers: [{ name: 'Accept', value: 'application/json' }] }
    expect(withSession(withHeader).headers).toContainEqual({ name: 'Accept', value: 'application/json' })
  })
})

describe('odgovor bez sadrzaja', () => {
  const original = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = original
  })

  type Outcome = { readonly ok: void } | { readonly err: string }

  const send = (): Promise<ReadonlyArray<Outcome>> =>
    Effect.runPromise(
      Stream.runCollect(
        Http.send<void, Outcome>(Http.post('https://x/y', Http.emptyBody, expectNoContent), {
          onSuccess: value => ({ ok: value }),
          onError: error => ({ err: error._tag }),
        }),
      ),
    ).then(Chunk.toReadonlyArray)

  // `expectJson` bi ovde dao `null`, a to nije isto sto i "nema odgovora".
  it('204 daje undefined, ne prazan string i ne null', async () => {
    globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 204 }))) as typeof fetch
    const [outcome] = await send()
    expect(outcome).toStrictEqual({ ok: undefined })
  })

  it('greska i dalje stize kao greska', async () => {
    globalThis.fetch = (() => Promise.resolve(new Response('', { status: 500 }))) as typeof fetch
    const [outcome] = await send()
    expect(outcome).toStrictEqual({ err: 'BadStatus' })
  })
})

describe('NoContent shema', () => {
  const decode = Schema.decodeUnknownEither(expectNoContent.decoder)

  // Praznina zavisi od toga kako je telo procitano, i od servisa do servisa.
  it.each([
    ['prazan tekst', ''],
    ['null', null],
    ['undefined', undefined],
    ['prazan objekat', {}],
  ])('prihvata %s kao odsustvo sadrzaja', (_naziv, value) => {
    const result = decode(value)
    expect(Either.isRight(result) && result.right).toBeUndefined()
  })

  it.each([
    ['tekst', 'nesto'],
    ['objekat sa poljem', { a: 1 }],
    ['broj', 0],
  ])('odbija %s — to jeste sadrzaj', (_naziv, value) => {
    expect(Either.isLeft(decode(value))).toBe(true)
  })
})
