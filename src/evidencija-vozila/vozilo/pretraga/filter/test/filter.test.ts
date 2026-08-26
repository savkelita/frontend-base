import { FastCheck, Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../../common/domain/combo'
import { toQuery } from '../../../../../common/pretraga'
import * as ModelVozila from '../../../../../sifarnici/domain/model-vozila'
import {
  changed,
  cleared,
  init,
  ioState,
  korisnikVozilaMsg,
  markaMsg,
  modelMsg,
  toCriteria,
  toState,
  update,
  vozacMsg,
  vrstaGorivaMsg,
  vrstaVozilaMsg,
  type FormValue,
  type Model,
} from '../index'
import type { Msg } from '../msg'

const open = (criteria: Parameters<typeof init>[0] = {}): Model => init(criteria, undefined)[0]

const apply = (msg: Msg, model: Model): Model => update(msg, model)[0]

const form = (fields: Partial<FormValue>): FormValue => ({ ...open().value, ...fields })

const query = (value: FormValue): string => toQuery({ criteria: toCriteria(value), order_: [] })

const dan = (year: number, month: number, day: number): Date => new Date(year, month - 1, day)

const skoda = { marka: 'Skoda' }
const octavia = { model: 'Octavia' }
const dizel = { id: 2, naziv: 'Dizel' }
const putnicko = { id: 5, naziv: 'Putnicko' }
const sluzba = { id: 7, naziv: 'Sluzba za IT' }
const pera = { id: 9, ime: 'Pera', prezime: 'Peric', imeZaPrikaz: 'PPeric' }

describe('marka i model idu kao tekst, ne kao id', () => {
  // BE za ove dve kombinacije vraca samo naziv, i kriterijum je isto naziv.
  it('kriterijum iz adrese vraca vrednost u polje', () => {
    const model = open({ markaVozila: ['eq', 'Skoda'], modelVozila: ['eq', 'Octavia'] })
    expect(model.value.markaVozila).toStrictEqual(skoda)
    expect(model.value.modelVozila).toStrictEqual(octavia)
  })

  it('izabrana marka i model idu u kriterijum kao eq nad nazivom', () => {
    expect(query(form({ markaVozila: skoda, modelVozila: octavia }))).toBe(
      'markaVozila=eq&markaVozila=Skoda&modelVozila=eq&modelVozila=Octavia',
    )
  })

  // Ceo podatak je u adresi, pa nema sta da se pamti niti da se dovlaci sa servera.
  it('ne trazi se od servera i ne ide u stanje istorije', () => {
    expect(init({ markaVozila: ['eq', 'Skoda'] }, undefined)[1]).toBe(Cmd.none)
    expect(toState(form({ markaVozila: skoda }))).toStrictEqual({
      vrstaGoriva: null,
      vrstaVozila: null,
      korisnikVozila: null,
      vozac: null,
    })
  })
})

describe('model zavisi od marke', () => {
  const saMarkom = (): Model => apply(markaMsg(Combo.selected([skoda])), open())

  const saModelom = (): Model => apply(modelMsg(Combo.selected([octavia])), saMarkom())

  it('pretraga modela nosi izabranu marku', () => {
    expect(ModelVozila.search('Skoda')(Combo.toRequest(null, 0)).url).toContain('marka=eq&marka=Skoda')
  })

  it('promena marke brise izabran model', () => {
    expect(saModelom().value.modelVozila).toStrictEqual(octavia)
    expect(apply(markaMsg(Combo.selected([{ marka: 'Fiat' }])), saModelom()).value.modelVozila).toBeNull()
  })

  // Ucitana lista pripada staroj marki, pa i ona mora da padne.
  it('promena marke prazni i listu modela', () => {
    const otvorena = apply(modelMsg(Combo.opened()), saModelom())
    expect(otvorena.modelCombo).not.toStrictEqual(Combo.empty())
    expect(apply(markaMsg(Combo.selected([{ marka: 'Fiat' }])), otvorena).modelCombo).toStrictEqual(Combo.empty())
  })

  it('ista marka izabrana ponovo ne dira model', () => {
    expect(apply(markaMsg(Combo.selected([{ marka: 'Skoda' }])), saModelom()).value.modelVozila).toStrictEqual(octavia)
  })

  it('skidanje marke brise i model', () => {
    const bezMarke = apply(markaMsg(Combo.selected([])), saModelom())
    expect(bezMarke.value.markaVozila).toBeNull()
    expect(bezMarke.value.modelVozila).toBeNull()
  })
})

describe('kombo polja koja nose id', () => {
  it('id iz adrese bez zapamcene vrednosti trazi taj slog', () => {
    const [model, cmd] = init({ vrstaGorivaID: 2 }, undefined)
    expect(model.value.vrstaGoriva).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  it('zapamcena vrednost iz istorije preskace poziv', () => {
    const [model, cmd] = init(
      { vrstaGorivaID: 2, vrstaVozilaID: 5, korisnikVozilaID: 7, vozacID: 9 },
      { vrstaGoriva: dizel, vrstaVozila: putnicko, korisnikVozila: sluzba, vozac: pera },
    )
    expect(model.value.vrstaGoriva).toStrictEqual(dizel)
    expect(model.value.vozac).toStrictEqual(pera)
    expect(cmd).toBe(Cmd.none)
  })

  it('zapamcena vrednost koja ne odgovara adresi se ne uzima', () => {
    const [model, cmd] = init({ vrstaGorivaID: 3 }, { vrstaGoriva: dizel })
    expect(model.value.vrstaGoriva).toBeNull()
    expect(cmd).not.toBe(Cmd.none)
  })

  it('izbor iz liste upisuje vrednost u polje', () => {
    expect(apply(vrstaGorivaMsg(Combo.selected([dizel])), open()).value.vrstaGoriva).toStrictEqual(dizel)
    expect(apply(vrstaVozilaMsg(Combo.selected([putnicko])), open()).value.vrstaVozila).toStrictEqual(putnicko)
    expect(apply(korisnikVozilaMsg(Combo.selected([sluzba])), open()).value.korisnikVozila).toStrictEqual(sluzba)
    expect(apply(vozacMsg(Combo.selected([pera])), open()).value.vozac).toStrictEqual(pera)
  })

  it('izabrane vrednosti idu u kriterijum kao goli brojevi', () => {
    expect(query(form({ vrstaGoriva: dizel, vrstaVozila: putnicko, korisnikVozila: sluzba, vozac: pera }))).toBe(
      'vrstaGorivaID=2&vrstaVozilaID=5&korisnikVozilaID=7&vozacID=9',
    )
  })

  it('stanje za istoriju nosi sve cetiri vrednosti', () => {
    expect(
      toState(form({ vrstaGoriva: dizel, vrstaVozila: putnicko, korisnikVozila: sluzba, vozac: pera })),
    ).toStrictEqual({ vrstaGoriva: dizel, vrstaVozila: putnicko, korisnikVozila: sluzba, vozac: pera })
  })
})

describe('ponistavanje', () => {
  it('vraca sva polja i sve combo modele na pocetak', () => {
    const popunjeno = apply(
      changed(form({ registarskaOznaka: 'BG', stanje: 'PASIVAN' })),
      apply(vozacMsg(Combo.selected([pera])), apply(markaMsg(Combo.selected([skoda])), open())),
    )
    const ocisceno = apply(cleared(), popunjeno)
    expect(ocisceno.value).toStrictEqual(open().value)
    expect(ocisceno.markaCombo).toStrictEqual(Combo.empty())
    expect(ocisceno.modelCombo).toStrictEqual(Combo.empty())
    expect(ocisceno.vozacCombo).toStrictEqual(Combo.empty())
  })
})

describe('datumski opseg', () => {
  const opseg = [dan(2020, 1, 1), dan(2020, 12, 31)] as const

  // Tilda je razdvojnik opsega; u adresi je URLSearchParams zapise kao %7E, sto BE dekoduje nazad.
  it('oba datuma idu kao jedan between kriterijum', () => {
    expect(query(form({ datumPrveRegistracije: opseg }))).toBe(
      'datumPrveRegistracije=between&datumPrveRegistracije=2020-01-01%7E2020-12-31',
    )
    expect(toCriteria(form({ datumPrveRegistracije: opseg })).datumPrveRegistracije).toStrictEqual([
      'between',
      '2020-01-01~2020-12-31',
    ])
  })

  // Jedan kraj je isto pretraga: operator se bira prema tome sta je popunjeno.
  it('polovina opsega salje granicu', () => {
    expect(query(form({ datumPrveRegistracije: [dan(2020, 1, 1), null] }))).toBe(
      'datumPrveRegistracije=after_or_same&datumPrveRegistracije=2020-01-01',
    )
    expect(query(form({ datumPrveRegistracije: [null, dan(2020, 12, 31)] }))).toBe(
      'datumPrveRegistracije=before_or_same&datumPrveRegistracije=2020-12-31',
    )
  })

  it('kriterijum iz adrese vraca datume u polje', () => {
    expect(
      open({ datumIsticanjaRegistracije: ['between', '2020-01-01~2020-12-31'] }).value.datumIsticanjaRegistracije,
    ).toStrictEqual([dan(2020, 1, 1), dan(2020, 12, 31)])
    expect(
      open({ datumIsticanjaRegistracije: ['after_or_same', '2020-01-01'] }).value.datumIsticanjaRegistracije,
    ).toStrictEqual([dan(2020, 1, 1), null])
  })

  // Prazno polje je jedno jedino: `null`. Par praznina ne postoji, pa nema dve praznine da se razilaze.
  it('ponistavanje vraca oba polja na prazno', () => {
    const popunjeno = apply(changed(form({ datumPrveRegistracije: opseg })), open())
    expect(apply(cleared(), popunjeno).value.datumPrveRegistracije).toBeNull()
    expect(open().value.datumPrveRegistracije).toBeNull()
  })
})

describe('dostavlja mesecnu km', () => {
  it('izbor ide kao gola logicka vrednost, bez operatora', () => {
    expect(query(form({ dostavljaMesecnuKm: true }))).toBe('dostavljaMesecnuKm=true')
  })

  // Ne sme da se pobrka sa praznim poljem: "ne dostavlja" je pretraga kao i svaka druga.
  it('ne je kriterijum, prazno nije', () => {
    expect(query(form({ dostavljaMesecnuKm: false }))).toBe('dostavljaMesecnuKm=false')
    expect(query(form({ dostavljaMesecnuKm: null }))).toBe('')
  })

  it('vrednost iz adrese stize do polja, i kad je ne', () => {
    expect(open({ dostavljaMesecnuKm: false }).value.dostavljaMesecnuKm).toBe(false)
    expect(open({ dostavljaMesecnuKm: true }).value.dostavljaMesecnuKm).toBe(true)
    expect(open({}).value.dostavljaMesecnuKm).toBeNull()
  })
})

describe('kriterijum', () => {
  it('prazan filter ne salje nijedan kriterijum', () => {
    expect(query(form({}))).toBe('')
  })

  it('registarska oznaka ide sa contains, enumi sa eq', () => {
    expect(query(form({ registarskaOznaka: 'BG', stanje: 'AKTIVAN', istekRegistracije: 'ISTEKAO' }))).toBe(
      'registarskaOznaka=contains&registarskaOznaka=BG&stanje=eq&stanje=AKTIVAN&istekRegistracije=eq&istekRegistracije=ISTEKAO',
    )
  })
})

const vrstaArb = FastCheck.record({ id: FastCheck.nat(), naziv: FastCheck.string() })

const stanje = FastCheck.oneof(
  FastCheck.constant(undefined),
  FastCheck.constant(null),
  FastCheck.constant({ nesto: 'drugo' }),
  vrstaArb.map(vrstaGoriva => ({ vrstaGoriva, vrstaVozila: null, korisnikVozila: null, vozac: null })),
)

describe('svojstva', () => {
  it('vrednost iz stanja se uzima samo kad joj se id poklapa sa adresom', () => {
    FastCheck.assert(
      FastCheck.property(FastCheck.nat(), stanje, (vrstaGorivaID, state) => {
        const izabrana = init({ vrstaGorivaID }, state)[0].value.vrstaGoriva
        expect(izabrana === null || izabrana.id === vrstaGorivaID).toBe(true)
      }),
    )
  })

  it('stanje prezivi put kroz istoriju', () => {
    FastCheck.assert(
      FastCheck.property(FastCheck.option(vrstaArb, { nil: null }), vrstaGoriva => {
        const state = toState(form({ vrstaGoriva }))
        const vraceno = Schema.decodeUnknownOption(ioState)(structuredClone(state))
        expect(Option.isSome(vraceno)).toBe(true)
        expect(Option.getOrNull(vraceno)).toStrictEqual(state)
      }),
    )
  })
})
