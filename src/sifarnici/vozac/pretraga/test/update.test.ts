import { Effect, Option, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Router from 'tea-effect/Router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../common/error'
import { isLoading, rows, total, type Page, type PretragaRequest } from '../../../../common/pretraga'
import { routes } from '../../../../router/route'
import type { Vozac, VozacCriteria, VozacOrder } from '../../../api'
import * as Kreiranje from '../../kreiranje'
import * as Filter from '../filter'
import { init, update } from '../index'
import { LIMIT, type Model } from '../model'
import {
  failed,
  filterMsg,
  kreiranjeMsg,
  loaded,
  pageChanged,
  retry,
  selectionChanged,
  sorted,
  startKreiranje,
} from '../msg'

const vozac = (id: number, prezime: string): Vozac => ({
  id,
  version: 1,
  ime: 'Pera',
  prezime,
  imeZaPrikaz: `Pera ${prezime}`,
  email: null,
  telefon: null,
  kategorije: [{ id: 1, oznaka: 'B' }],
  stanje: 'AKTIVAN',
})

const page = (rows: ReadonlyArray<Vozac>, total: number): Page<Vozac> => ({ rows, total })

const request = (
  rest: Partial<PretragaRequest<VozacCriteria, VozacOrder>> = {},
): PretragaRequest<VozacCriteria, VozacOrder> => ({
  criteria: {},
  order_: [],
  limit_: LIMIT,
  offset_: 0,
  ...rest,
})

const open = (query: Parameters<typeof init>[0] = {}): Model => init(query, undefined)[0]

const ready = (): Model => update(loaded(request(), page([vozac(1, 'Peric')], 500)), open())[0]

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
  it('prazna adresa daje prvu stranu bez sortiranja, i odmah trazi podatke', () => {
    const [model, cmd] = init({}, undefined)
    expect(model.offset).toBe(0)
    expect(model.sort).toBeNull()
    expect(isLoading(model.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('cita stranu i sortiranje iz adrese', () => {
    const model = open({ offset: 200, order: 'prezime', dir: 'DESC' })
    expect(model.offset).toBe(200)
    expect(model.sort).toStrictEqual({ attribute: 'prezime', direction: 'DESC' })
  })

  it('podrazumeva ASC kad adresa nosi samo polje', () => {
    expect(open({ order: 'ime' }).sort).toStrictEqual({ attribute: 'ime', direction: 'ASC' })
  })

  it('pocinje bez izabranog reda', () => {
    expect(open().selected).toStrictEqual([])
  })
})

describe('odgovor servera', () => {
  it('popunjava tabelu', () => {
    const model = open()
    const [next] = update(loaded(request(), page([vozac(1, 'Peric')], 42)), model)
    expect(rows(next.data).map(v => v.id)).toStrictEqual([1])
    expect(total(next.data)).toBe(42)
    expect(isLoading(next.data)).toBe(false)
  })

  it('greska tekuceg zahteva ulazi u model', () => {
    const model = open()
    const [next] = update(failed(request(), ApiError.ServerFailure()), model)
    expect(next.data._tag).toBe('Failed')
  })

  // Posle greske paging nestaje (nema ukupnog broja), pa je ponovni pokusaj jedini izlaz.
  it('ponovni pokusaj trazi bas tu stranu, ne prvu', () => {
    const failedModel = update(failed(request({ offset_: LIMIT }), ApiError.NetworkError()), open({ offset: LIMIT }))[0]
    const [retried, cmd] = update(retry(), failedModel)
    expect(isLoading(retried.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)

    const [done] = update(loaded(request({ offset_: LIMIT }), page([vozac(1, 'Peric')], 500)), retried)
    expect(rows(done.data).map(v => v.id)).toStrictEqual([1])
  })

  // Ruter na promenu adrese pravi nov model, pa odgovor starog mora da otpadne.
  it('odbacuje odgovor koji pripada drugoj strani', () => {
    const model = open({ offset: 100 })
    const [next] = update(loaded(request({ offset_: 0 }), page([vozac(1, 'Peric')], 42)), model)
    expect(rows(next.data)).toStrictEqual([])
    expect(isLoading(next.data)).toBe(true)
  })

  it('odbacuje odgovor koji pripada drugom sortiranju', () => {
    const model = open({ order: 'ime' })
    const [next] = update(loaded(request({ order_: [['prezime', 'ASC']] }), page([vozac(1, 'Peric')], 1)), model)
    expect(rows(next.data)).toStrictEqual([])
  })

  it('zakasnela greska ne obara tekuce ucitavanje', () => {
    const model = open({ offset: 100 })
    const [next] = update(failed(request({ offset_: 0 }), ApiError.ServerFailure()), model)
    expect(next.data._tag).toBe('Loading')
  })
})

describe('sortiranje i strana menjaju adresu', () => {
  it('sortiranje vraca na prvu stranu', async () => {
    const [, cmd] = update(sorted({ attribute: 'prezime', direction: 'ASC' }), open({ offset: 300 }))
    expect(await pushedUrls(cmd)).toStrictEqual(['/sifarnici/vozaci?order=prezime&dir=ASC'])
  })

  it('promena strane cuva kriterijum i sortiranje', async () => {
    const [, cmd] = update(pageChanged(LIMIT), open({ order: 'ime', dir: 'DESC', ime: ['contains', 'Pera'] }))
    expect(await pushedUrls(cmd)).toStrictEqual([
      `/sifarnici/vozaci?offset=${LIMIT}&order=ime&dir=DESC&ime=contains&ime=Pera`,
    ])
  })

  it('ni sortiranje ni strana ne diraju model — nov pravi ruter iz adrese', () => {
    const model = open()
    expect(update(pageChanged(LIMIT), model)[0]).toBe(model)
    expect(update(sorted({ attribute: 'ime', direction: 'ASC' }), model)[0]).toBe(model)
  })
})

describe('prelazak na novu adresu unutar istog ekrana', () => {
  // Bez ovoga tabela na svaku sledecu stranu zatreperi u prazno.
  it('zatecena tabela ostaje dok sledeca strana stize', () => {
    const [model] = init({ offset: LIMIT }, undefined, ready())
    expect(isLoading(model.data)).toBe(true)
    expect(rows(model.data).map(v => v.id)).toStrictEqual([1])
    expect(total(model.data)).toBe(500)
  })

  it('prvi dolazak na ekran nema sta da zadrzi', () => {
    const [model] = init({}, undefined)
    expect(isLoading(model.data)).toBe(true)
    expect(rows(model.data)).toStrictEqual([])
  })

  it('fioka ostaje kako ju je korisnik ostavio', () => {
    const zatvorena = update(filterMsg(Filter.toggled()), ready())[0]
    expect(init({ offset: LIMIT }, undefined, zatvorena)[0].filterModel.isOpen).toBe(false)
    expect(init({ offset: LIMIT }, undefined, ready())[0].filterModel.isOpen).toBe(true)
  })

  // Red iz stare strane nema smisla na novoj, a i mogao je u medjuvremenu da se promeni.
  it('izbor reda ne prelazi na novu stranu', () => {
    const izabrano = update(selectionChanged([vozac(1, 'Peric')]), ready())[0]
    expect(init({ offset: LIMIT }, undefined, izabrano)[0].selected).toStrictEqual([])
  })

  it('polja filtera prate adresu, ne prethodni model', () => {
    const otkucano = update(filterMsg(Filter.changed({ ...ready().filterModel.value, ime: 'Mika' })), ready())[0]
    expect(init({ ime: ['contains', 'Pera'] }, undefined, otkucano)[0].filterModel.value.ime).toBe('Pera')
  })
})

describe('filter', () => {
  const change = (model: Model, fields: Partial<Filter.FormValue>) =>
    filterMsg(Filter.changed({ ...model.filterModel.value, ...fields }))

  it('prazna adresa daje prazan kriterijum i prazna polja', () => {
    expect(open().criteria).toStrictEqual({})
    expect(open().filterModel.value.ime).toBeNull()
  })

  it('cita kriterijum iz adrese, a polja pocinju od njega', () => {
    const model = open({ ime: ['contains', 'Pera'], stanje: ['eq', 'AKTIVAN'] })
    expect(model.criteria.ime).toStrictEqual(['contains', 'Pera'])
    expect(model.filterModel.value.ime).toBe('Pera')
    expect(model.filterModel.value.stanje).toBe('AKTIVAN')
  })

  it('kriterijum iz adrese ide u zahtev', () => {
    const model = open({ ime: ['contains', 'Pera'] })
    const [next] = update(
      loaded(request({ criteria: { ime: ['contains', 'Pera'] } }), page([vozac(1, 'Peric')], 1)),
      model,
    )
    expect(rows(next.data).map(v => v.id)).toStrictEqual([1])
  })

  // Ovde je referenca pukla: njen cuvar poredi stranu i sortiranje, a kriterijum ne.
  it('odbacuje odgovor koji pripada drugom kriterijumu', () => {
    const model = open({ ime: ['contains', 'Pera'] })
    const [next] = update(
      loaded(request({ criteria: { ime: ['contains', 'Mika'] } }), page([vozac(1, 'Peric')], 1)),
      model,
    )
    expect(rows(next.data)).toStrictEqual([])
  })

  // Kucanje ne salje zahtev; primena je izricita.
  it('kucanje menja samo polja, ne i primenjen kriterijum', () => {
    const model = open({ ime: ['contains', 'Pera'] })
    const [next, cmd] = update(change(model, { ime: 'Mika' }), model)
    expect(next.filterModel.value.ime).toBe('Mika')
    expect(next.criteria.ime).toStrictEqual(['contains', 'Pera'])
    expect(cmd).toBe(Cmd.none)
  })

  it('ponistavanje prazni polja, ali ne pretrazuje', () => {
    const model = open({ ime: ['contains', 'Pera'] })
    const [next, cmd] = update(filterMsg(Filter.cleared()), model)
    expect(next.filterModel.value.ime).toBeNull()
    expect(next.criteria.ime).toStrictEqual(['contains', 'Pera'])
    expect(cmd).toBe(Cmd.none)
  })

  it('primena upisuje kriterijum u adresu i vraca na prvu stranu', async () => {
    const model = open({ offset: 100 })
    const [, cmd] = update(filterMsg(Filter.submitted()), update(change(model, { ime: 'Pera' }), model)[0])
    expect(await pushedUrls(cmd)).toStrictEqual(['/sifarnici/vozaci?ime=contains&ime=Pera'])
  })

  it('adresa nosi kriterijum onako kako ga BE prima', () => {
    const parsed = Router.parse(routes, {
      pathname: '/sifarnici/vozaci',
      search: '?ime=contains&ime=Pera&stanje=eq&stanje=AKTIVAN',
    })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value).toStrictEqual({
      _tag: 'vozaci',
      query: { ime: ['contains', 'Pera'], stanje: ['eq', 'AKTIVAN'] },
    })
  })
})

describe('izbor reda', () => {
  it('pamti izabrani red', () => {
    const row = vozac(7, 'Jovic')
    expect(update(selectionChanged([row]), ready())[0].selected).toStrictEqual([row])
  })

  // Red bi bio sa strane koja se upravo menja: dijalog bi radio nad necim sto vise nije u tabeli.
  it('dok stize odgovor izbor se ne prima', () => {
    const model = init({ offset: LIMIT }, undefined, ready())[0]
    expect(isLoading(model.data)).toBe(true)
    expect(update(selectionChanged([vozac(1, 'Peric')]), model)[0].selected).toStrictEqual([])
  })

  it('prvo ucitavanje takodje ne prima izbor', () => {
    expect(update(selectionChanged([vozac(7, 'Jovic')]), open())[0].selected).toStrictEqual([])
  })

  // Ponovni klik na izabran red u Fluentu skida izbor; prazan skup je poniscen izbor.
  it('ponistavanje izbora dolazi do modela', () => {
    const izabrano = update(selectionChanged([vozac(7, 'Jovic')]), ready())[0]
    expect(update(selectionChanged([]), izabrano)[0].selected).toStrictEqual([])
  })
})

describe('kreiranje', () => {
  const otvoreno = (): Model => update(startKreiranje(), ready())[0]

  it('dugme otvara dijalog', () => {
    expect(Option.isSome(otvoreno().kreiranje)).toBe(true)
  })

  it('odustajanje gasi dijalog i ne dira tabelu', () => {
    const sDijalogom = otvoreno()
    const [model, cmd] = update(kreiranjeMsg(Kreiranje.closed()), sDijalogom)
    expect(Option.isNone(model.kreiranje)).toBe(true)
    expect(model.data).toBe(sDijalogom.data)
    expect(cmd).toBe(Cmd.none)
  })

  // Nov vozac se ne vidi dok se strana ne procita ponovo.
  it('uspesno kreiranje gasi dijalog i ponovo trazi stranu', () => {
    const [model, cmd] = update(kreiranjeMsg(Kreiranje.saved({ id: 7, version: 1 })), otvoreno())
    expect(Option.isNone(model.kreiranje)).toBe(true)
    expect(isLoading(model.data)).toBe(true)
    expect(rows(model.data).map(v => v.id)).toStrictEqual([1])
    expect(cmd).not.toBe(Cmd.none)
  })

  it('poruka kreiranja bez otvorenog dijaloga otpada', () => {
    const model = ready()
    expect(update(kreiranjeMsg(Kreiranje.closed()), model)[0]).toBe(model)
  })
})

describe('adresa', () => {
  it('prva strana bez sortiranja je cist put, bez upitnika', () => {
    expect(Router.format(routes.vozaci, {})).toBe('/sifarnici/vozaci')
  })

  it('ruta se parsira nazad u isti upit', () => {
    const parsed = Router.parse(routes, { pathname: '/sifarnici/vozaci', search: '?offset=100&order=ime&dir=DESC' })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value).toStrictEqual({ _tag: 'vozaci', query: { offset: 100, order: 'ime', dir: 'DESC' } })
  })
})
