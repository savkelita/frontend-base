import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../../common/domain/combo'
import { toQuery } from '../../../../../common/pretraga'
import {
  changed,
  cleared,
  init,
  kategorijaMsg,
  submitted,
  toCriteria,
  toState,
  toggled,
  update,
  type FormValue,
  type Model,
} from '../index'
import type { Msg } from '../msg'

const open = (criteria: Parameters<typeof init>[0] = {}): Model => init(criteria, undefined)[0]

const apply = (msg: Msg, model: Model): Model => update(msg, model)[0]

const form = (fields: Partial<FormValue>): FormValue => ({ ...open().value, ...fields })

const query = (value: FormValue): string => toQuery({ criteria: toCriteria(value), order_: [] })

describe('polja', () => {
  it('prazan kriterijum daje prazna polja, a fioka je otvorena', () => {
    const model = open()
    expect(model.value).toStrictEqual(form({}))
    expect(model.isOpen).toBe(true)
  })

  it('polja pocinju od primenjenog kriterijuma', () => {
    const model = open({ ime: ['contains', 'Pera'], stanje: ['eq', 'AKTIVAN'] })
    expect(model.value.ime).toBe('Pera')
    expect(model.value.stanje).toBe('AKTIVAN')
  })

  it('uzima vrednost predikata bez obzira na operator iz adrese', () => {
    expect(open({ ime: ['starts_with', 'Pera'] }).value.ime).toBe('Pera')
  })

  it('kucanje menja polje', () => {
    expect(apply(changed(form({ ime: 'Mika' })), open()).value.ime).toBe('Mika')
  })

  // Primenu izvodi ekran; filter samo javi da je zatrazena.
  it('slanje ne dira polja', () => {
    const typed = apply(changed(form({ ime: 'Mika' })), open())
    expect(apply(submitted(), typed).value.ime).toBe('Mika')
  })

  it('ponistavanje prazni polja', () => {
    const typed = apply(changed(form({ ime: 'Mika', stanje: 'PASIVAN' })), open())
    expect(apply(cleared(), typed).value).toStrictEqual(open().value)
  })

  it('fioka se otvara i zatvara istom porukom', () => {
    const closed = apply(toggled(), open())
    expect(closed.isOpen).toBe(false)
    expect(apply(toggled(), closed).isOpen).toBe(true)
  })
})

describe('komande', () => {
  // Polja menjaju samo model; sa serverom prica jedino combo.
  it('rad sa poljima ne pokrece komandu', () => {
    const model = open()
    expect(init({}, undefined)[1]).toBe(Cmd.none)
    expect(update(changed(form({ ime: 'Mika' })), model)[1]).toBe(Cmd.none)
    expect(update(submitted(), model)[1]).toBe(Cmd.none)
    expect(update(cleared(), model)[1]).toBe(Cmd.none)
    expect(update(toggled(), model)[1]).toBe(Cmd.none)
  })
})

describe('kategorija', () => {
  const kategorija = { id: 3, oznaka: 'C' }

  it('bez kategorije u adresi combo je prazan', () => {
    expect(open().value.kategorija).toBeNull()
  })

  // Neko ti je poslao link: iz adrese se zna samo id, oznaku mora da donese BE.
  it('id iz adrese bez zapamcene vrednosti trazi taj slog', () => {
    const [model, cmd] = init({ kategorijaID: 3 }, undefined)
    expect(model.value.kategorija).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  it('odgovor na inicijalizaciju upisuje vrednost u polje', () => {
    const [model] = init({ kategorijaID: 3 }, undefined)
    expect(apply(kategorijaMsg(Combo.initialized([kategorija])), model).value.kategorija).toStrictEqual(kategorija)
  })

  it('izbor iz liste upisuje vrednost u polje', () => {
    expect(apply(kategorijaMsg(Combo.selected([kategorija])), open()).value.kategorija).toStrictEqual(kategorija)
  })

  it('prazan izbor prazni polje', () => {
    const izabrano = apply(kategorijaMsg(Combo.selected([kategorija])), open())
    expect(apply(kategorijaMsg(Combo.selected([])), izabrano).value.kategorija).toBeNull()
  })

  it('ponistavanje vraca combo na pocetak, ne samo vrednost', () => {
    const otvoren = apply(kategorijaMsg(Combo.opened()), apply(kategorijaMsg(Combo.selected([kategorija])), open()))
    const ocisceno = apply(cleared(), otvoren)
    expect(ocisceno.value.kategorija).toBeNull()
    expect(ocisceno.kategorijaCombo).toStrictEqual(Combo.empty())
  })

  // Back/forward: vrednost je vec u istoriji, pa BE nema sta da radi.
  it('zapamcena vrednost iz istorije preskace poziv', () => {
    const [model, cmd] = init({ kategorijaID: 3 }, { kategorija })
    expect(model.value.kategorija).toStrictEqual(kategorija)
    expect(cmd).toBe(Cmd.none)
  })

  it('zapamcena vrednost koja ne odgovara adresi se ne uzima', () => {
    const [model, cmd] = init({ kategorijaID: 9 }, { kategorija })
    expect(model.value.kategorija).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  it('tudje stanje u istoriji se ignorise', () => {
    expect(init({ kategorijaID: 3 }, { nesto: 'drugo' })[0].value.kategorija).toBeNull()
  })

  // Kroz stranice i sortiranje vrednost putuje modelom, isto bez poziva.
  it('prethodni model cuva vrednost kroz navigaciju', () => {
    const [previous] = init({ kategorijaID: 3 }, { kategorija })
    const [model, cmd] = init({ kategorijaID: 3 }, undefined, previous)
    expect(model.value.kategorija).toStrictEqual(kategorija)
    expect(cmd).toBe(Cmd.none)
  })

  it('izabrana kategorija ide u kriterijum kao go broj', () => {
    expect(query(form({ kategorija }))).toBe('kategorijaID=3')
  })

  it('stanje za istoriju nosi izabranu kategoriju', () => {
    expect(toState(form({ kategorija }))).toStrictEqual({ kategorija })
  })
})

describe('kriterijum', () => {
  it('prazan filter ne salje nijedan kriterijum', () => {
    expect(query(form({}))).toBe('')
  })

  it('tekst ide sa contains, stanje sa eq', () => {
    expect(toCriteria(form({ ime: 'Pera' })).ime).toStrictEqual(['contains', 'Pera'])
    expect(query(form({ ime: 'Pera', stanje: 'AKTIVAN' }))).toBe('ime=contains&ime=Pera&stanje=eq&stanje=AKTIVAN')
  })

  it('prazan string se ponasa kao prazno polje', () => {
    expect(query(form({ ime: '' }))).toBe('')
  })

  it('salje samo popunjena polja', () => {
    expect(query(form({ telefon: '060' }))).toBe('telefon=contains&telefon=060')
  })
})
