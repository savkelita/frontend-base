import { Effect, Option, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Router from 'tea-effect/Router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../common/error'
import { isLoading, rows, total, type Page, type PretragaRequest } from '../../../../common/pretraga'
import { routes } from '../../../../router/route'
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../../api'
import * as Filter from '../filter'
import { init, update } from '../index'
import { LIMIT, type Model } from '../model'
import { failed, filterMsg, loaded, pageChanged, retry, selectionChanged, sorted } from '../msg'

const vozilo = (id: number, registarskaOznaka: string): Vozilo => ({
  id,
  version: 1,
  registarskaOznaka,
  datumPrveRegistracije: new Date(2020, 4, 12),
  datumIsticanjaRegistracije: new Date(2026, 10, 3),
  markaVozila: 'Skoda',
  modelVozila: 'Octavia',
  vrstaGorivaNaziv: 'Dizel',
  vrstaVozilaNaziv: 'Putnicko',
  vozacIme: 'Pera',
  vozacPrezime: 'Peric',
  korisnikVozilaNaziv: 'Sluzba za IT',
  dostavljaMesecnuKm: true,
  napomena: null,
  stanje: 'AKTIVAN',
  audit: {
    korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
    datumKreiranja: new Date(2026, 7, 12, 9, 14),
    korisnikPromenio: null,
    datumPromene: null,
  },
})

const page = (rows: ReadonlyArray<Vozilo>, total: number): Page<Vozilo> => ({ rows, total })

const AKTIVNA: VoziloCriteria = { stanje: ['eq', 'AKTIVAN'] }

const request = (
  rest: Partial<PretragaRequest<VoziloCriteria, VoziloOrder>> = {},
): PretragaRequest<VoziloCriteria, VoziloOrder> => ({
  criteria: AKTIVNA,
  order_: [['registarskaOznaka', 'ASC']],
  limit_: LIMIT,
  offset_: 0,
  ...rest,
})

const open = (query: Parameters<typeof init>[0] = {}): Model => init(query, undefined)[0]

const ready = (): Model => update(loaded(request(), page([vozilo(1, 'BG123AA')], 500)), open())[0]

// Komanda ne nosi poruku, pa se navigacija vidi samo po tome sta je zavrsilo u istoriji.
const pushedUrls = async (cmd: Cmd.Cmd<unknown>): Promise<ReadonlyArray<string>> => {
  const pushed: Array<string> = []
  vi.stubGlobal('window', {
    history: { state: null, pushState: (_state: unknown, _unused: string, url: string) => void pushed.push(url) },
    location: { pathname: '/', search: '', hash: '', href: '/', origin: '' },
    dispatchEvent: () => true,
  })
  vi.stubGlobal('PopStateEvent', class {})
  try {
    await Effect.runPromise(Stream.runDrain(cmd))
  } finally {
    vi.unstubAllGlobals()
  }
  return pushed
}

describe('otvaranje ekrana', () => {
  // Kao u VozniPark-u: gola adresa znaci "aktivna vozila, po registarskoj oznaci".
  it('prazna adresa daje podrazumevanu pretragu', () => {
    const [model, cmd] = init({}, undefined)
    expect(model.criteria).toStrictEqual(AKTIVNA)
    expect(model.sort).toStrictEqual({ attribute: 'registarskaOznaka', direction: 'ASC' })
    expect(model.filterModel.value.stanje).toBe('AKTIVAN')
    expect(isLoading(model.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  // Podrazumevano vazi samo za golu adresu; cim korisnik nesto zada, adresa je merodavna.
  it('adresa koja nosi bilo sta gasi podrazumevano', () => {
    const model = open({ offset: LIMIT })
    expect(model.criteria).toStrictEqual({})
    expect(model.sort).toBeNull()
    expect(model.filterModel.value.stanje).toBeNull()
  })

  it('cita stranu i sortiranje iz adrese', () => {
    const model = open({ offset: 200, order: 'markaVozila', dir: 'DESC' })
    expect(model.offset).toBe(200)
    expect(model.sort).toStrictEqual({ attribute: 'markaVozila', direction: 'DESC' })
  })

  it('podrazumeva ASC kad adresa nosi samo polje', () => {
    expect(open({ order: 'modelVozila' }).sort).toStrictEqual({ attribute: 'modelVozila', direction: 'ASC' })
  })

  it('pocinje bez izabranog reda', () => {
    expect(open().selected).toStrictEqual([])
  })
})

describe('odgovor servera', () => {
  it('popunjava tabelu', () => {
    const [next] = update(loaded(request(), page([vozilo(1, 'BG123AA')], 42)), open())
    expect(rows(next.data).map(v => v.id)).toStrictEqual([1])
    expect(total(next.data)).toBe(42)
    expect(isLoading(next.data)).toBe(false)
  })

  it('greska tekuceg zahteva ulazi u model', () => {
    const [next] = update(failed(request(), ApiError.ServerFailure()), open())
    expect(next.data._tag).toBe('Failed')
  })

  it('ponovni pokusaj trazi bas tu stranu, ne prvu', () => {
    const model = open({ offset: LIMIT })
    const pao = update(failed(request({ criteria: {}, order_: [], offset_: LIMIT }), ApiError.NetworkError()), model)[0]
    const [retried, cmd] = update(retry(), pao)
    expect(isLoading(retried.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)

    const [done] = update(
      loaded(request({ criteria: {}, order_: [], offset_: LIMIT }), page([vozilo(1, 'BG123AA')], 500)),
      retried,
    )
    expect(rows(done.data).map(v => v.id)).toStrictEqual([1])
  })

  // Ruter na promenu adrese pravi nov model, pa odgovor starog mora da otpadne.
  it('odbacuje odgovor koji pripada drugom kriterijumu', () => {
    const [next] = update(loaded(request({ criteria: {} }), page([vozilo(1, 'BG123AA')], 1)), open())
    expect(rows(next.data)).toStrictEqual([])
    expect(isLoading(next.data)).toBe(true)
  })

  it('odbacuje odgovor koji pripada drugom sortiranju', () => {
    const [next] = update(loaded(request({ order_: [['stanje', 'ASC']] }), page([vozilo(1, 'BG123AA')], 1)), open())
    expect(rows(next.data)).toStrictEqual([])
  })
})

describe('sortiranje i strana menjaju adresu', () => {
  it('sortiranje vraca na prvu stranu i nosi podrazumevani kriterijum', async () => {
    const [, cmd] = update(sorted({ attribute: 'markaVozila', direction: 'DESC' }), open())
    expect(await pushedUrls(cmd)).toStrictEqual([
      '/evidencija-vozila/vozila?order=markaVozila&dir=DESC&stanje=eq&stanje=AKTIVAN',
    ])
  })

  it('promena strane cuva kriterijum i sortiranje', async () => {
    const [, cmd] = update(pageChanged(LIMIT), open())
    expect(await pushedUrls(cmd)).toStrictEqual([
      `/evidencija-vozila/vozila?offset=${LIMIT}&order=registarskaOznaka&dir=ASC&stanje=eq&stanje=AKTIVAN`,
    ])
  })

  it('ni sortiranje ni strana ne diraju model — nov pravi ruter iz adrese', () => {
    const model = open()
    expect(update(pageChanged(LIMIT), model)[0]).toBe(model)
    expect(update(sorted({ attribute: 'stanje', direction: 'ASC' }), model)[0]).toBe(model)
  })
})

describe('prelazak na novu adresu unutar istog ekrana', () => {
  it('zatecena tabela ostaje dok sledeca strana stize', () => {
    const [model] = init({ offset: LIMIT }, undefined, ready())
    expect(isLoading(model.data)).toBe(true)
    expect(rows(model.data).map(v => v.id)).toStrictEqual([1])
    expect(total(model.data)).toBe(500)
  })

  it('fioka ostaje kako ju je korisnik ostavio', () => {
    const zatvorena = update(filterMsg(Filter.toggled()), ready())[0]
    expect(init({ offset: LIMIT }, undefined, zatvorena)[0].filterModel.isOpen).toBe(false)
    expect(init({ offset: LIMIT }, undefined, ready())[0].filterModel.isOpen).toBe(true)
  })

  it('izbor reda ne prelazi na novu stranu', () => {
    const izabrano = update(selectionChanged([vozilo(1, 'BG123AA')]), ready())[0]
    expect(init({ offset: LIMIT }, undefined, izabrano)[0].selected).toStrictEqual([])
  })

  it('polja filtera prate adresu, ne prethodni model', () => {
    const otkucano = update(
      filterMsg(Filter.changed({ ...ready().filterModel.value, registarskaOznaka: 'NS' })),
      ready(),
    )[0]
    expect(
      init({ registarskaOznaka: ['contains', 'BG'] }, undefined, otkucano)[0].filterModel.value.registarskaOznaka,
    ).toBe('BG')
  })
})

describe('filter', () => {
  const change = (model: Model, fields: Partial<Filter.FormValue>) =>
    filterMsg(Filter.changed({ ...model.filterModel.value, ...fields }))

  it('cita kriterijum iz adrese, a polja pocinju od njega', () => {
    const model = open({ registarskaOznaka: ['contains', 'BG'], istekRegistracije: ['eq', 'ISTEKAO'] })
    expect(model.criteria.registarskaOznaka).toStrictEqual(['contains', 'BG'])
    expect(model.filterModel.value.registarskaOznaka).toBe('BG')
    expect(model.filterModel.value.istekRegistracije).toBe('ISTEKAO')
  })

  // Kucanje ne salje zahtev; primena je izricita.
  it('kucanje menja samo polja, ne i primenjen kriterijum', () => {
    const model = open({ registarskaOznaka: ['contains', 'BG'] })
    const [next, cmd] = update(change(model, { registarskaOznaka: 'NS' }), model)
    expect(next.filterModel.value.registarskaOznaka).toBe('NS')
    expect(next.criteria.registarskaOznaka).toStrictEqual(['contains', 'BG'])
    expect(cmd).toBe(Cmd.none)
  })

  it('ponistavanje prazni polja, ali ne pretrazuje', () => {
    const model = open({ registarskaOznaka: ['contains', 'BG'] })
    const [next, cmd] = update(filterMsg(Filter.cleared()), model)
    expect(next.filterModel.value.registarskaOznaka).toBeNull()
    expect(next.criteria.registarskaOznaka).toStrictEqual(['contains', 'BG'])
    expect(cmd).toBe(Cmd.none)
  })

  it('primena upisuje kriterijum u adresu i vraca na prvu stranu', async () => {
    const model = open({ offset: 100 })
    const [, cmd] = update(filterMsg(Filter.submitted()), update(change(model, { registarskaOznaka: 'BG' }), model)[0])
    expect(await pushedUrls(cmd)).toStrictEqual([
      '/evidencija-vozila/vozila?registarskaOznaka=contains&registarskaOznaka=BG',
    ])
  })

  // Filter nema obavezna polja: jedan kraj opsega je pretraga, samo sa drugim operatorom.
  it('primena sa jednim krajem opsega pretrazuje', async () => {
    const model = open()
    const [, cmd] = update(
      filterMsg(Filter.submitted()),
      update(change(model, { datumPrveRegistracije: [new Date(2020, 0, 1), null] }), model)[0],
    )
    expect(await pushedUrls(cmd)).toStrictEqual([
      '/evidencija-vozila/vozila?order=registarskaOznaka&dir=ASC&datumPrveRegistracije=after_or_same&datumPrveRegistracije=2020-01-01&stanje=eq&stanje=AKTIVAN',
    ])
  })

  it('adresa nosi kriterijum onako kako ga BE prima', () => {
    const parsed = Router.parse(routes, {
      pathname: '/evidencija-vozila/vozila',
      search: '?registarskaOznaka=contains&registarskaOznaka=BG&stanje=eq&stanje=PASIVAN',
    })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value).toStrictEqual({
      _tag: 'vozila',
      query: { registarskaOznaka: ['contains', 'BG'], stanje: ['eq', 'PASIVAN'] },
    })
  })
})

describe('izbor reda', () => {
  it('pamti izabrani red', () => {
    const row = vozilo(7, 'NS456BB')
    expect(update(selectionChanged([row]), ready())[0].selected).toStrictEqual([row])
  })

  it('dok stize odgovor izbor se ne prima', () => {
    const model = init({ offset: LIMIT }, undefined, ready())[0]
    expect(isLoading(model.data)).toBe(true)
    expect(update(selectionChanged([vozilo(1, 'BG123AA')]), model)[0].selected).toStrictEqual([])
  })
})

describe('adresa', () => {
  it('prva strana bez sortiranja je cist put, bez upitnika', () => {
    expect(Router.format(routes.vozila, {})).toBe('/evidencija-vozila/vozila')
  })

  it('ruta se parsira nazad u isti upit', () => {
    const parsed = Router.parse(routes, {
      pathname: '/evidencija-vozila/vozila',
      search: '?offset=100&order=markaVozila&dir=DESC',
    })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value).toStrictEqual({ _tag: 'vozila', query: { offset: 100, order: 'markaVozila', dir: 'DESC' } })
  })
})
