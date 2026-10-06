import { Effect, Option, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Router from 'tea-effect/Router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../common/error'
import { routes } from '../../../../router/route'
import type { VozacInfo } from '../../../api'
import { init, update } from '../index'
import { Model } from '../model'
import { receiveFailed, received, retry, vozilaMsg } from '../msg'
import * as Filter from '../vozila/filter'
import { filterMsg, retry as vozilaRetry } from '../vozila/msg'

const vozac = (id = 7): VozacInfo => ({
  id,
  version: 1,
  ime: 'Pera',
  prezime: 'Peric',
  imeZaPrikaz: 'Pera Peric',
  email: null,
  telefon: null,
  kategorije: [{ id: 1, oznaka: 'B' }],
  stanje: 'AKTIVAN',
})

const otvoren = (): Model => init({ id: 7 })[0]

const spreman = (): Model => update(received(vozac()), otvoren())[0]

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

describe('otvaranje pregleda', () => {
  it('trazi vozaca', () => {
    const [model, cmd] = init({ id: 7 })
    expect(model._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
  })

  // Ugnjezdena pretraga krece tek kad vozac stigne, jer joj treba njegov id.
  it('dolazak vozaca pokrece ugnjezdenu pretragu', () => {
    const [model, cmd] = update(received(vozac()), otvoren())
    expect(model._tag).toBe('Ready')
    if (model._tag !== 'Ready') return
    expect(model.vozila.vozacID).toBe(7)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('greska ulazi u model', () => {
    const [model] = update(receiveFailed(ApiError.ServerFailure()), otvoren())
    expect(model._tag).toBe('Failed')
  })

  it('ponovni pokusaj vraca na ucitavanje i trazi opet', () => {
    const pukao = update(receiveFailed(ApiError.ServerFailure()), otvoren())[0]
    const [model, cmd] = update(retry(), pukao)
    expect(model._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
  })
})

describe('adresa pregleda', () => {
  it('ruta nosi id u putanji', () => {
    const parsed = Router.parse(routes, { pathname: '/sifarnici/vozaci/7', search: '' })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value).toStrictEqual({ _tag: 'vozac', params: { id: 7 } })
  })

  // Pretraga vozaca i pregled jednog vozaca su dve rute; specificnija ne sme da proguta opstiju.
  it('pretraga vozaca i dalje ima svoju rutu', () => {
    const parsed = Router.parse(routes, { pathname: '/sifarnici/vozaci', search: '' })
    expect(Option.isSome(parsed)).toBe(true)
    if (!Option.isSome(parsed)) return
    expect(parsed.value._tag).toBe('vozaci')
  })
})

// Sustina: filter ugnjezdene pretrage nigde ne dodiruje adresu.
describe('ugnjezdena pretraga zivi u modelu ekrana', () => {
  const otkucaj = (model: Model): Model => {
    if (model._tag !== 'Ready') throw new Error('ocekivan Ready')
    return update(
      vozilaMsg(filterMsg(Filter.changed({ ...model.vozila.filterModel.value, registarskaOznaka: 'BG' }))),
      model,
    )[0]
  }

  it('primenjen filter stoji u modelu ekrana', () => {
    const [model] = update(vozilaMsg(filterMsg(Filter.submitted())), otkucaj(spreman()))
    expect(model._tag).toBe('Ready')
    if (model._tag !== 'Ready') return
    expect(model.vozila.criteria.registarskaOznaka).toStrictEqual(['contains', 'BG'])
  })

  it('primena filtera ne menja adresu', async () => {
    const [, cmd] = update(vozilaMsg(filterMsg(Filter.submitted())), otkucaj(spreman()))
    expect(await pushedUrls(cmd)).toStrictEqual([])
  })
})

describe('poruke van svog stanja', () => {
  it('poruka ugnjezdene pretrage pre Ready otpada', () => {
    const model = otvoren()
    expect(update(vozilaMsg(vozilaRetry()), model)[0]).toBe(model)
  })

  it('drugi odgovor na vozaca se ignorise kad je vec Ready', () => {
    const model = spreman()
    expect(update(received(vozac(9)), model)[0]).toBe(model)
  })
})
