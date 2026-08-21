import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { pretraziKategorijaVozackeDozvoleCombo } from '../../../../sifarnici/api'
import type { Value as KategorijaVozaca } from '../../../../sifarnici/domain/kategorija-vozaca'
import { ApiError } from '../../../error'
import { rows, total } from '../../../pretraga'
import { LIMIT, empty, init, toRequest, update, type Model } from '../index'
import { applied, closed, failed, more, opened, received, typed } from '../msg'

const search = pretraziKategorijaVozackeDozvoleCombo

const kategorija = (id: number, oznaka: string): KategorijaVozaca => ({ id, oznaka })

const list = (model: Model<KategorijaVozaca>): ReadonlyArray<KategorijaVozaca> =>
  model.data === null ? [] : rows(model.data)

const ukupno = (model: Model<KategorijaVozaca>): number => (model.data === null ? 0 : total(model.data))

const step = (msg: Parameters<typeof update<KategorijaVozaca>>[1], model: Model<KategorijaVozaca>) =>
  update(search, msg, model)

const listed = (count: number, ukupno = count): Model<KategorijaVozaca> => {
  const model = step(opened(), empty<KategorijaVozaca>())[0]
  const page = { rows: Array.from({ length: count }, (_, i) => kategorija(i + 1, `K${i + 1}`)), total: ukupno }
  return step(received(toRequest(null, 0), page), model)[0]
}

describe('otvaranje', () => {
  it('prvo otvaranje trazi prvu stranu', () => {
    const [model, cmd] = step(opened(), empty<KategorijaVozaca>())
    expect(model.open).toBe(true)
    expect(model.data?._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
  })

  // Ovo je bila zamerka na stari combo: svako otvaranje je ponovo zvalo BE.
  it('ponovno otvaranje ne zove server', () => {
    const [model, cmd] = step(opened(), step(closed(), listed(3))[0])
    expect(model.open).toBe(true)
    expect(cmd).toBe(Cmd.none)
  })
})

describe('kucanje', () => {
  it('otkucano stoji u modelu, a upit ceka', () => {
    const [model, cmd] = step(typed('be'), empty<KategorijaVozaca>())
    expect(model.input).toBe('be')
    expect(model.filter).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  // Zakasneli otkucaj nema sta da trazi — korisnik je u medjuvremenu vec pisao dalje.
  it('presticen otkucaj otpada', () => {
    const first = step(typed('b'), empty<KategorijaVozaca>())[0]
    const second = step(typed('be'), first)[0]
    const [model, cmd] = step(applied(first.seq), second)
    expect(model).toBe(second)
    expect(cmd).toBe(Cmd.none)
  })

  it('poslednji otkucaj pretrazuje', () => {
    const typedModel = step(typed('be'), empty<KategorijaVozaca>())[0]
    const [model, cmd] = step(applied(typedModel.seq), typedModel)
    expect(model.filter).toBe('be')
    expect(model.data?._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
  })

  it('prazno polje se ponasa kao da filtera nema', () => {
    const cleared = step(typed(''), step(typed('be'), empty<KategorijaVozaca>())[0])[0]
    expect(step(applied(cleared.seq), cleared)[0].filter).toBeNull()
  })
})

describe('odgovor', () => {
  it('popunjava listu', () => {
    const model = listed(2)
    expect(list(model).map(k => k.oznaka)).toStrictEqual(['K1', 'K2'])
  })

  // Isti cuvar kao u tabeli: odgovor koji ne pripada tekucem upitu se ne uzima.
  it('odbacuje odgovor drugog upita', () => {
    const model = step(opened(), empty<KategorijaVozaca>())[0]
    const [next] = step(received(toRequest('be', 0), { rows: [kategorija(1, 'K1')], total: 1 }), model)
    expect(next).toBe(model)
  })

  it('greska ulazi u model', () => {
    const model = step(opened(), empty<KategorijaVozaca>())[0]
    expect(step(failed(toRequest(null, 0), ApiError.ServerFailure()), model)[0].data?._tag).toBe('Failed')
  })
})

describe('ucitaj jos', () => {
  it('dopisuje sledecu grupu na postojecu listu', () => {
    const model = step(more(), listed(LIMIT, 25))[0]
    const [next] = step(received(toRequest(null, LIMIT), { rows: [kategorija(99, 'K99')], total: 25 }), model)
    expect(list(next)).toHaveLength(LIMIT + 1)
    expect(ukupno(next)).toBe(25)
  })

  it('kad je sve ucitano nema sta da se trazi', () => {
    const [model, cmd] = step(more(), listed(3))
    expect(cmd).toBe(Cmd.none)
    expect(model.data?._tag).toBe('Ready')
  })
})

describe('inicijalizacija po id-u', () => {
  it('bez id-a nema poziva', () => {
    const [model, cmd] = init<KategorijaVozaca>(undefined, search)
    expect(model).toStrictEqual(empty<KategorijaVozaca>())
    expect(cmd).toBe(Cmd.none)
  })

  // Lista se ne dira: ona se puni tek kad korisnik otvori padajuci deo.
  it('sa id-om trazi taj slog, ali listu ne popunjava', () => {
    const [model, cmd] = init<KategorijaVozaca>(3, search)
    expect(model.data).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  it('upit po id-u nosi id i nema unetu vrednost', () => {
    expect(toRequest(null, 0, 3).criteria).toStrictEqual({ id: 3, unetaVrednost: undefined })
  })
})
