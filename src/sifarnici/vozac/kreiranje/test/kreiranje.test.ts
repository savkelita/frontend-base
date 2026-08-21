import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../common/domain/combo'
import { ApiError } from '../../../../common/error'
import * as Form from '../../../../common/form'
import type { Value as Kategorija } from '../../../domain/kategorija-vozaca'
import { init, toCmd, update } from '../index'
import { vForm, type FormValue, type Model } from '../model'
import { changed, closed, kategorijeMsg, saveFailed, saved, submitted } from '../msg'

const kategorija = (id: number, oznaka: string): Kategorija => ({ id, oznaka })

const B = kategorija(1, 'B')
const C = kategorija(2, 'C')

const popunjen: FormValue = {
  ime: 'Pera',
  prezime: 'Peric',
  imeZaPrikaz: 'Pera Peric',
  email: 'pera@primer.rs',
  telefon: '0631234567',
  kategorije: [B],
}

const open = (): Model => init[0]

const withValue = (value: FormValue): Model => update(changed(value), open())[0]

const form = (fields: Partial<FormValue>): FormValue => ({ ...open().value, ...fields })

const poruke = (value: FormValue): ReadonlyArray<string> =>
  Form.visibleIssues(vForm, value, true).map(issue => `${issue.path.join('.')}: ${issue.message}`)

describe('validacija', () => {
  it('prazan formular trazi obavezna polja', () => {
    expect(poruke(form({}))).toStrictEqual([
      'ime: Podatak je obavezan',
      'prezime: Podatak je obavezan',
      'imeZaPrikaz: Podatak je obavezan',
      'kategorije: Podatak je obavezan',
    ])
  })

  it('popunjen formular nema zamerki', () => {
    expect(poruke(popunjen)).toStrictEqual([])
  })

  // E-mail i telefon vozac ne mora da ima, ali ako ih unese moraju da valjaju.
  it('prazan e-mail i telefon prolaze', () => {
    expect(poruke({ ...popunjen, email: null, telefon: null })).toStrictEqual([])
  })

  it('e-mail bez domena ne prolazi', () => {
    expect(poruke({ ...popunjen, email: 'pera@primer' })).toStrictEqual(['email: Podatak nije validan'])
  })

  // Ovo je razlog zbog kog kategorije nisu obican niz nego multi combo sa svojim pravilom.
  it('bar jedna kategorija je obavezna', () => {
    expect(poruke({ ...popunjen, kategorije: [] })).toStrictEqual(['kategorije: Podatak je obavezan'])
  })
})

describe('snimanje', () => {
  it('nepotpun formular pali greske i ne zove server', () => {
    const [model, cmd] = update(submitted(), open())
    expect(model.showErrors).toBe(true)
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('potpun formular ide na server', () => {
    const [model, cmd] = update(submitted(), withValue(popunjen))
    expect(model.isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  // Dvoklik na Sacuvaj bi inace napravio dva vozaca.
  it('dok snimanje traje ponovni klik ne radi nista', () => {
    const uToku = update(submitted(), withValue(popunjen))[0]
    const [model, cmd] = update(submitted(), uToku)
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska servera zavrsava snimanje i ostaje u modelu', () => {
    const uToku = update(submitted(), withValue(popunjen))[0]
    const [model] = update(saveFailed(ApiError.ServerFailure()), uToku)
    expect(model.isSubmitting).toBe(false)
    expect(model.error._tag).toBe('Some')
  })

  // Posle neuspeha korisnik ispravlja podatak; stara greska tu vise nema sta da trazi.
  it('izmena polja sklanja gresku servera', () => {
    const sGreskom = update(saveFailed(ApiError.ServerFailure()), withValue(popunjen))[0]
    expect(update(changed({ ...popunjen, ime: 'Mika' }), sGreskom)[0].error._tag).toBe('None')
  })

  it('uspeh gasi snimanje, a ekran iznad gasi dijalog', () => {
    const uToku = update(submitted(), withValue(popunjen))[0]
    const [model, cmd] = update(saved({ id: 7, version: 1 }), uToku)
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('odustajanje ne dira model', () => {
    const model = withValue(popunjen)
    expect(update(closed(), model)[0]).toBe(model)
  })
})

describe('kategorije', () => {
  it('izbor iz comboa upisuje vrednosti u formular', () => {
    const [model] = update(kategorijeMsg(Combo.selected([B, C])), open())
    expect(model.value.kategorije).toStrictEqual([B, C])
  })

  it('uklanjanje poslednje kategorije vraca formular u nevalidno stanje', () => {
    const sKategorijama = update(kategorijeMsg(Combo.selected([B])), withValue(popunjen))[0]
    const [model] = update(kategorijeMsg(Combo.selected([])), sKategorijama)
    expect(model.value.kategorije).toStrictEqual([])
    expect(poruke(model.value)).toStrictEqual(['kategorije: Podatak je obavezan'])
  })

  it('na server ide id, ne ceo slog', () => {
    const result = Form.validate(vForm, { ...popunjen, kategorije: [B, C] })
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(result.value).kategorije).toStrictEqual([1, 2])
  })

  it('prazan e-mail i telefon idu na server kao null', () => {
    const result = Form.validate(vForm, { ...popunjen, email: null, telefon: null })
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(result.value)).toMatchObject({ email: null, telefon: null })
  })
})
