import { Effect, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../../common/error'
import { isLoading, rows, total, type Page, type PretragaRequest } from '../../../../../common/pretraga'
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../../../../evidencija-vozila/api'
import * as Filter from '../filter'
import { init, update } from '../index'
import { LIMIT, type Model } from '../model'
import { failed, filterMsg, loaded, pageChanged, retry, selectionChanged, sorted } from '../msg'

const VOZAC_ID = 7

const vozilo = (id: number, oznaka: string): Vozilo => ({
  id,
  version: 1,
  registarskaOznaka: oznaka,
  datumPrveRegistracije: null,
  datumIsticanjaRegistracije: null,
  markaVozila: 'VW',
  modelVozila: 'Golf',
  vrstaGorivaNaziv: 'Dizel',
  vrstaVozilaNaziv: 'Putnicko',
  vozacIme: 'Pera',
  vozacPrezime: 'Peric',
  korisnikVozilaNaziv: null,
  dostavljaMesecnuKm: false,
  napomena: null,
  stanje: 'AKTIVAN',
  audit: {
    korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
    datumKreiranja: new Date(2026, 7, 12, 9, 14),
    korisnikPromenio: null,
    datumPromene: null,
  },
})

const page = (redovi: ReadonlyArray<Vozilo>, ukupno: number): Page<Vozilo> => ({ rows: redovi, total: ukupno })

const request = (
  rest: Partial<PretragaRequest<VoziloCriteria, VoziloOrder>> = {},
): PretragaRequest<VoziloCriteria, VoziloOrder> => ({
  criteria: { vozacID: VOZAC_ID },
  order_: [],
  limit_: LIMIT,
  offset_: 0,
  ...rest,
})

const open = (): Model => init(VOZAC_ID)[0]

const ready = (): Model => update(loaded(request(), page([vozilo(1, 'BG123AA')], 40)), open())[0]

const change = (model: Model, fields: Partial<Filter.FormValue>) =>
  filterMsg(Filter.changed({ ...model.filterModel.value, ...fields }))

// Ako ugnjezdena pretraga ikada dodirne adresu, ovde ce se videti.
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

describe('otvaranje', () => {
  it('odmah trazi vozila tog vozaca', () => {
    const [model, cmd] = init(VOZAC_ID)
    expect(model.vozacID).toBe(VOZAC_ID)
    expect(model.offset).toBe(0)
    expect(isLoading(model.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('pocinje bez kriterijuma i bez izabranog reda', () => {
    expect(open().criteria).toStrictEqual({})
    expect(open().selected).toStrictEqual([])
  })
})

// Ovo je razlika u odnosu na ekransku pretragu: tamo sve ide kroz Navigation.pushUrl.
describe('adresa se ne dira', () => {
  it('primena filtera ne menja adresu', async () => {
    const otkucano = update(change(open(), { registarskaOznaka: 'BG' }), open())[0]
    const [, cmd] = update(filterMsg(Filter.submitted()), otkucano)
    expect(await pushedUrls(cmd)).toStrictEqual([])
  })

  it('sortiranje ne menja adresu', async () => {
    const [, cmd] = update(sorted({ attribute: 'markaVozila', direction: 'ASC' }), ready())
    expect(await pushedUrls(cmd)).toStrictEqual([])
  })

  it('promena strane ne menja adresu', async () => {
    const [, cmd] = update(pageChanged(LIMIT), ready())
    expect(await pushedUrls(cmd)).toStrictEqual([])
  })
})

// Posledica: sortiranje i strana menjaju model odmah, jer nema adrese da to uradi umesto njih.
describe('model nosi stanje pretrage', () => {
  it('sortiranje upisuje u model i vraca na prvu stranu', () => {
    const naDrugoj = update(pageChanged(LIMIT), ready())[0]
    const [model] = update(sorted({ attribute: 'markaVozila', direction: 'DESC' }), naDrugoj)
    expect(model.sort).toStrictEqual({ attribute: 'markaVozila', direction: 'DESC' })
    expect(model.offset).toBe(0)
  })

  it('promena strane upisuje offset i trazi ponovo', () => {
    const [model, cmd] = update(pageChanged(LIMIT), ready())
    expect(model.offset).toBe(LIMIT)
    expect(isLoading(model.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('primena filtera upisuje kriterijum i vraca na prvu stranu', () => {
    const naDrugoj = update(pageChanged(LIMIT), ready())[0]
    const otkucano = update(change(naDrugoj, { registarskaOznaka: 'BG' }), naDrugoj)[0]
    const [model] = update(filterMsg(Filter.submitted()), otkucano)
    expect(model.criteria.registarskaOznaka).toStrictEqual(['contains', 'BG'])
    expect(model.offset).toBe(0)
  })

  it('kucanje menja samo polja, ne i primenjen kriterijum', () => {
    const [model, cmd] = update(change(ready(), { registarskaOznaka: 'BG' }), ready())
    expect(model.filterModel.value.registarskaOznaka).toBe('BG')
    expect(model.criteria).toStrictEqual({})
    expect(cmd).toBe(Cmd.none)
  })

  it('ponistavanje prazni polja, ali ne pretrazuje', () => {
    const otkucano = update(change(ready(), { registarskaOznaka: 'BG' }), ready())[0]
    const [model, cmd] = update(filterMsg(Filter.cleared()), otkucano)
    expect(model.filterModel.value.registarskaOznaka).toBeNull()
    expect(cmd).toBe(Cmd.none)
  })
})

describe('zahtev', () => {
  it('vozac je uvek u kriterijumu, i posle filtera', () => {
    const otkucano = update(change(ready(), { registarskaOznaka: 'BG' }), ready())[0]
    const [model] = update(filterMsg(Filter.submitted()), otkucano)
    const [next] = update(
      loaded(
        request({ criteria: { vozacID: VOZAC_ID, registarskaOznaka: ['contains', 'BG'] } }),
        page([vozilo(1, 'BG123AA')], 1),
      ),
      model,
    )
    expect(rows(next.data).map(v => v.id)).toStrictEqual([1])
  })

  // Isti cuvar kao na ekranu: model se ovde ne pravi iznova, pa je jos vazniji.
  it('odbacuje odgovor koji pripada drugom kriterijumu', () => {
    const [next] = update(loaded(request({ criteria: { vozacID: 9 } }), page([vozilo(1, 'BG123AA')], 1)), open())
    expect(rows(next.data)).toStrictEqual([])
    expect(isLoading(next.data)).toBe(true)
  })

  it('odbacuje odgovor koji pripada drugoj strani', () => {
    const naDrugoj = update(pageChanged(LIMIT), ready())[0]
    const [next] = update(loaded(request({ offset_: 0 }), page([vozilo(2, 'BG456BB')], 1)), naDrugoj)
    expect(rows(next.data).map(v => v.id)).toStrictEqual([1])
  })

  it('popunjava tabelu kad se zahtev poklopi', () => {
    const [model] = update(loaded(request(), page([vozilo(1, 'BG123AA')], 40)), open())
    expect(rows(model.data).map(v => v.id)).toStrictEqual([1])
    expect(total(model.data)).toBe(40)
  })

  it('greska tekuceg zahteva ulazi u model', () => {
    const [model] = update(failed(request(), ApiError.ServerFailure()), open())
    expect(model.data._tag).toBe('Failed')
  })

  it('ponovni pokusaj trazi istu stranu', () => {
    const [model, cmd] = update(retry(), ready())
    expect(model.offset).toBe(0)
    expect(isLoading(model.data)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })
})

describe('izbor reda', () => {
  it('pamti izabran red', () => {
    const row = vozilo(1, 'BG123AA')
    expect(update(selectionChanged([row]), ready())[0].selected).toStrictEqual([row])
  })

  it('dok stize odgovor izbor se ne prima', () => {
    const ucitava = update(pageChanged(LIMIT), ready())[0]
    expect(update(selectionChanged([vozilo(1, 'BG123AA')]), ucitava)[0].selected).toStrictEqual([])
  })

  // Red sa stare strane nema smisla na novoj.
  it('izbor pada na promenu strane i filtera', () => {
    const izabrano = update(selectionChanged([vozilo(1, 'BG123AA')]), ready())[0]
    expect(update(pageChanged(LIMIT), izabrano)[0].selected).toStrictEqual([])
    expect(update(filterMsg(Filter.submitted()), izabrano)[0].selected).toStrictEqual([])
  })
})
