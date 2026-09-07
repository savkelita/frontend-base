import { describe, it, expect } from 'vitest'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Combo from '../../../common/forms/combo'
import type { ArtikalPakovanjeOtpremnicaComboResult, StavkaPorudzbeniceOtpremnicaComboResult } from '../../api'
import { StavkaForm, toCmd, chosenOrderLine, clearOrderDrivenFields, fillFromPakovanje } from './form'
import type { StavkaFormModel, StavkaFormMsg } from './form'
import { Msg } from './msg'
import { init, update } from './index'
import type { Context, Model } from './index'

// -------------------------------------------------------------------------------------
// Podaci za testove
// -------------------------------------------------------------------------------------

const ctx: Context = { otpremnicaID: 7, magacinID: 3, porudzbenicaID: 42 }

// kolicinaUOsnovnojJM x kolicinaUPakovanju = 2 x 6 = 12 osnovnih jedinica po pakovanju
const pakovanje: ArtikalPakovanjeOtpremnicaComboResult = {
  id: 500,
  artikalID: 100,
  artikalSifra: 'ART-1',
  artikalNaziv: 'Mleko 1l',
  artikalBarKod: null,
  osnovniArtikal: true,
  jedinicaMereSifra: 'KOM',
  jedinicaMereOznaka: 'kom',
  osnovnaJedinicaMereSifra: 'KOM',
  osnovnaJedinicaMereOznaka: 'kom',
  osnovnaJedinicaMereNaziv: 'Komad',
  pakovanjeNaziv: 'Kutija',
  barKod: null,
  kolicinaUPakovanju: 6,
  kolicinaUOsnovnojJM: 2,
  pakovanjeDimenzijaSifra: 'PD-1',
  pakovanjeDimenzijaNaziv: 'Kutija 12/1',
  sirina: 1,
  duzina: 1,
  visina: 1,
  jedinicaMereZaDuzinuSifra: 'CM',
  jedinicaMereZaDuzinuOznaka: 'cm',
  jedinicaMereZaDuzinuNaziv: 'Centimetar',
  brutoTezina: 1,
  jedinicaMereZaTezinuSifra: 'KG',
  jedinicaMereZaTezinuOznaka: 'kg',
  jedinicaMereZaTezinuNaziv: 'Kilogram',
}

const stavkaPorudzbenice: StavkaPorudzbeniceOtpremnicaComboResult = {
  id: 900,
  redniBroj: 1,
  artikalID: 100,
  artikalPakovanjeID: 500,
  artikalSifra: 'ART-1',
  artikalNaziv: 'Mleko 1l',
  artikalPakovanjeNaziv: 'Kutija 12/1',
  porucenaKolicina: 10,
  porucenaOsnovnaKolicina: 120,
  osnovnaJedinicaMereOznaka: 'kom',
}

const field = (key: string, msg: unknown) => ({ _tag: 'Field', key, msg }) as StavkaFormMsg
const pick = (key: string, value: string, label: string, data?: unknown) =>
  field(key, Combo.Msg.Picked({ option: { value, label, data } }))
const type = (key: string, text: string) => field(key, text)

/** Izvedene vrednosti upisuje sama forma, pa je jedan update već smireno stanje. */
const apply = (model: StavkaFormModel, msg: StavkaFormMsg): StavkaFormModel => StavkaForm.update(msg, model)[0]

const start = (): StavkaFormModel => StavkaForm.create()[0]
const valueOf = (model: StavkaFormModel, key: 'kolicina' | 'osnovnaKolicina' | 'redniBroj') =>
  model.states[key] as string
const chosen = (model: StavkaFormModel, key: 'artikal' | 'artikalPakovanje' | 'stavkaPorudzbenice') =>
  StavkaForm.selected(model, key)[0]

// -------------------------------------------------------------------------------------
// Forma sama za sebe — ono što ./form deklariše, bez učešća feature-a
// -------------------------------------------------------------------------------------

describe('stavka otpremnice form', () => {
  it('disables pakovanje until an artikal is chosen, then searches within it', () => {
    const empty = start()
    expect(StavkaForm.fieldUi(empty, 'artikalPakovanje').enabled).toBe(false)

    const withArtikal = apply(empty, pick('artikal', '100', 'ART-1 - Mleko 1l'))
    expect(StavkaForm.fieldUi(withArtikal, 'artikalPakovanje').enabled).toBe(true)
  })

  it('derives osnovna kolicina from both package factors', () => {
    let m = start()
    m = apply(m, pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje))
    m = apply(m, type('kolicina', '2,5'))
    // 2,5 x kolicinaUOsnovnojJM (2) x kolicinaUPakovanju (6)
    expect(valueOf(m, 'osnovnaKolicina')).toBe('30')
  })

  it('recomputes when the package changes, not only when the quantity does', () => {
    let m = start()
    m = apply(m, pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje))
    m = apply(m, type('kolicina', '3'))
    expect(valueOf(m, 'osnovnaKolicina')).toBe('36')

    m = apply(m, pick('artikalPakovanje', '501', 'Paleta', { ...pakovanje, id: 501, kolicinaUPakovanju: 3 }))
    expect(valueOf(m, 'osnovnaKolicina')).toBe('18')
  })

  it('a changed artikal drops the package, and the derived value goes with it', () => {
    let m = start()
    m = apply(m, pick('artikal', '100', 'ART-1'))
    m = apply(m, pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje))
    m = apply(m, type('kolicina', '3'))
    expect(valueOf(m, 'osnovnaKolicina')).toBe('36')

    m = apply(m, pick('artikal', '101', 'ART-2'))
    expect(chosen(m, 'artikalPakovanje')).toBeUndefined() // kaskadom
    expect(valueOf(m, 'osnovnaKolicina')).toBe('') // nema pakovanja, nema iz čega da se izvede
    expect(valueOf(m, 'kolicina')).toBe('3') // otkucana količina je unos korisnika, i ostaje
  })

  it('the derived value is restored after a programmatic write too, not only after typing', () => {
    let m = apply(start(), type('kolicina', '4'))
    expect(valueOf(m, 'osnovnaKolicina')).toBe('') // još nema pakovanja

    m = fillFromPakovanje(m, pakovanje)
    expect(valueOf(m, 'osnovnaKolicina')).toBe('48')
  })

  it('an order line takes artikal and pakovanje out of the hands of the user', () => {
    let m = start()
    m = apply(m, pick('stavkaPorudzbenice', '900', '1 - ART-1 - Mleko 1l', stavkaPorudzbenice))
    expect(StavkaForm.fieldUi(m, 'artikal').enabled).toBe(false)
    expect(StavkaForm.fieldUi(m, 'artikalPakovanje').enabled).toBe(false)
    // ...ali se i dalje validiraju, pa prazno popunjavanje ne može da prođe neprimećeno
    expect(StavkaForm.validate(m).some(i => i.path[0] === 'artikal')).toBe(true)
  })

  it('clearOrderDrivenFields wipes what a changed order line decides', () => {
    let m = start()
    m = apply(m, pick('artikal', '100', 'ART-1'))
    m = apply(m, pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje))
    m = apply(m, type('kolicina', '3'))

    const cleared = clearOrderDrivenFields(m)
    expect(chosen(cleared, 'artikal')).toBeUndefined()
    expect(chosen(cleared, 'artikalPakovanje')).toBeUndefined()
    expect(valueOf(cleared, 'kolicina')).toBe('')
    expect(valueOf(cleared, 'osnovnaKolicina')).toBe('')
  })

  it('the derived field is not the user to edit', () => {
    expect(StavkaForm.fieldUi(start(), 'osnovnaKolicina').readonly).toBe(true)
  })

  it('fillFromPakovanje fills both combos with labels, not bare ids', () => {
    const m = fillFromPakovanje(start(), pakovanje)
    expect(chosen(m, 'artikal')).toEqual({ value: '100', label: 'ART-1 - Mleko 1l' })
    expect(chosen(m, 'artikalPakovanje')?.label).toBe('Kutija 12/1')
  })

  it('toCmd maps the validated payload onto KreirajStavkaOtpremniceCmd', () => {
    let m = start()
    m = apply(m, type('redniBroj', '4'))
    m = apply(m, pick('artikal', '100', 'ART-1'))
    m = apply(m, pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje))
    m = apply(m, type('kolicina', '2'))

    const [, payload] = StavkaForm.trySubmit(m)
    expect(Option.isSome(payload)).toBe(true)
    if (Option.isNone(payload)) return

    expect(toCmd(payload.value, { otpremnicaID: 7, kreirajMagacinArtikalPakovanje: true })).toEqual({
      otpremnicaID: 7,
      redniBroj: 4,
      artikalPakovanjeID: 500,
      stavkaPorudzbeniceID: null,
      kolicina: 2,
      osnovnaKolicina: 24,
      kreirajMagacinArtikalPakovanje: true,
    })
  })
})

// -------------------------------------------------------------------------------------
// Feature — učitavanje, preduslov ispred snimanja, i ishod
// -------------------------------------------------------------------------------------

const opened = (): Model => update(ctx, Msg.Loaded({ predlozeniRedniBroj: 4 }), init(ctx)[0])[0]

const loadedOf = (model: Model) => {
  if (model._tag !== 'Ready') throw new Error('expected Ready, got ' + model._tag)
  return model.loaded
}

/** Forma popunjena dovoljno da bude ispravna. */
const filled = (model: Model): Model =>
  [
    pick('artikal', '100', 'ART-1'),
    pick('artikalPakovanje', '500', 'Kutija 12/1', pakovanje),
    type('kolicina', '2'),
  ].reduce<Model>((m, fm) => {
    const loaded = loadedOf(m)
    return { _tag: 'Ready', loaded: { ...loaded, form: apply(loaded.form, fm) } }
  }, model)

describe('kreiranje stavke otpremnice', () => {
  it('opens on the line number the server proposed', () => {
    const [model, cmd] = init(ctx)
    expect(model._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
    expect(valueOf(loadedOf(opened()).form, 'redniBroj')).toBe('4')
  })

  it('reports a failed load instead of showing an empty form', () => {
    const [model] = update(ctx, Msg.LoadFailed({ error: { _tag: 'NetworkError', error: 'x' } }), init(ctx)[0])
    expect(model._tag).toBe('Failed')
  })

  it('an incomplete form does not reach the server', () => {
    const [model, cmd] = update(ctx, Msg.Provera(), opened())
    expect(cmd).toBe(Cmd.none)
    expect(loadedOf(model).saving._tag).toBe('Idle')
    expect(loadedOf(model).form.submitAttempted).toBe(true)
  })

  it('save asks the precondition first and holds the payload', () => {
    const [model, cmd, outcome] = update(ctx, Msg.Provera(), filled(opened()))
    expect(loadedOf(model).saving._tag).toBe('Provera')
    expect(Option.isSome(loadedOf(model).pending)).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
    expect(outcome._tag).toBe('Active')
  })

  it('a known packaging goes straight to the save', () => {
    const checking = update(ctx, Msg.Provera(), filled(opened()))[0]
    const [model, cmd] = update(ctx, Msg.Checked({ info: { postoji: true } }), checking)
    expect(loadedOf(model).saving._tag).toBe('Saving')
    expect(cmd).not.toBe(Cmd.none)
  })

  it('an unknown packaging asks the user before writing anything', () => {
    const checking = update(ctx, Msg.Provera(), filled(opened()))[0]
    const [model, cmd] = update(ctx, Msg.Checked({ info: { postoji: false } }), checking)
    expect(loadedOf(model).saving._tag).toBe('Confirming')
    expect(cmd).toBe(Cmd.none) // još ništa nije upisano

    const [saving, saveCmd] = update(ctx, Msg.PotvrdiKreiranjeMagacinArtikalPakovanje({ kreiraj: true }), model)
    expect(loadedOf(saving).saving._tag).toBe('Saving')
    expect(saveCmd).not.toBe(Cmd.none)
  })

  it('backing out of the question abandons the save and returns the form', () => {
    const confirming = update(
      ctx,
      Msg.Checked({ info: { postoji: false } }),
      update(ctx, Msg.Provera(), filled(opened()))[0],
    )[0]
    const [model, cmd] = update(ctx, Msg.DismissConfirm(), confirming)
    expect(loadedOf(model).saving._tag).toBe('Idle')
    expect(Option.isNone(loadedOf(model).pending)).toBe(true)
    expect(loadedOf(model).form.status).toBe('Editing')
    expect(cmd).toBe(Cmd.none)
  })

  it('one Failed handler covers every request on the save path', () => {
    const checking = update(ctx, Msg.Provera(), filled(opened()))[0]
    const [model] = update(ctx, Msg.Failed({ error: { _tag: 'NetworkError', error: 'x' } }), checking)
    expect(loadedOf(model).saving._tag).toBe('Idle')
    expect(loadedOf(model).form.status).toBe('Editing')
    expect(loadedOf(model).dovlacenjeArtiklaUProgress).toBe(false)
    expect(Option.isSome(loadedOf(model).error)).toBe(true)
  })

  it('the outcome carries the created identity to the host', () => {
    const [, , outcome] = update(ctx, Msg.Saved({ identifikator: { id: 11, version: 0 } }), filled(opened()))
    expect(outcome).toEqual({ _tag: 'Success', identifikator: { id: 11, version: 0 } })
  })

  it('closing is refused while something is in flight', () => {
    const checking = update(ctx, Msg.Provera(), filled(opened()))[0]
    expect(update(ctx, Msg.Close(), checking)[2]._tag).toBe('Active')
    expect(update(ctx, Msg.Close(), opened())[2]._tag).toBe('Cancel')
  })

  it('choosing an order line looks up what it points at, then fills both combos', () => {
    const [chosenModel, cmd] = update(
      ctx,
      Msg.Form({ msg: pick('stavkaPorudzbenice', '900', '1 - ART-1 - Mleko 1l', stavkaPorudzbenice) }),
      opened(),
    )
    expect(loadedOf(chosenModel).dovlacenjeArtiklaUProgress).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
    expect(chosenOrderLine(loadedOf(chosenModel).form)).toEqual(stavkaPorudzbenice)

    const [model] = update(
      ctx,
      Msg.Prefilled({ response: { total_: 1, offset_: 0, result: [pakovanje] } }),
      chosenModel,
    )
    expect(loadedOf(model).dovlacenjeArtiklaUProgress).toBe(false)
    expect(chosen(loadedOf(model).form, 'artikal')?.label).toBe('ART-1 - Mleko 1l')
    expect(chosen(loadedOf(model).form, 'artikalPakovanje')?.label).toBe('Kutija 12/1')
  })
})
