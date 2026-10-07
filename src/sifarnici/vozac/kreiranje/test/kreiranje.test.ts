import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../common/domain/combo'
import { ApiError } from '../../../../common/error'
import * as Form from '../../../../common/form'
import type { Value as Kategorija } from '../../../domain/kategorija-vozaca'
import { init, toCmd, update, type Result } from '../index'
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
  telefon: '38163123456',
  kategorije: [B],
}

const open = (): Model => init[0]

const aktivan = (result: Result) => {
  if (result._tag !== 'Active') throw new Error(`ocekivan Active, a stigao ${result._tag}`)
  return result
}

const withValue = (value: FormValue): Model => aktivan(update(changed(value), open())).model

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
    const { model, cmd } = aktivan(update(submitted(), open()))
    expect(model.showErrors).toBe(true)
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('potpun formular ide na server', () => {
    const { model, cmd } = aktivan(update(submitted(), withValue(popunjen)))
    expect(model.isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  // Dvoklik na Sacuvaj bi inace napravio dva vozaca.
  it('dok snimanje traje ponovni klik ne radi nista', () => {
    const uToku = aktivan(update(submitted(), withValue(popunjen))).model
    const { model, cmd } = aktivan(update(submitted(), uToku))
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska servera zavrsava snimanje i ostaje u modelu', () => {
    const uToku = aktivan(update(submitted(), withValue(popunjen))).model
    const { model } = aktivan(update(saveFailed(ApiError.ServerFailure()), uToku))
    expect(model.isSubmitting).toBe(false)
    expect(model.error._tag).toBe('Some')
  })

  // Posle neuspeha korisnik ispravlja podatak; stara greska tu vise nema sta da trazi.
  it('izmena polja sklanja gresku servera', () => {
    const sGreskom = aktivan(update(saveFailed(ApiError.ServerFailure()), withValue(popunjen))).model
    const { model } = aktivan(update(changed({ ...popunjen, ime: 'Mika' }), sGreskom))
    expect(model.error._tag).toBe('None')
  })

  it('uspeh javlja ekranu iznad koji je slog nastao', () => {
    const uToku = aktivan(update(submitted(), withValue(popunjen))).model
    const result = update(saved({ id: 7, version: 1 }), uToku)
    expect(result._tag).toBe('Done')
    expect(result._tag === 'Done' && result.value.id).toBe(7)
  })

  it('odustajanje javlja ekranu iznad da zatvori dijalog', () => {
    expect(update(closed(), withValue(popunjen))._tag).toBe('Closed')
  })
})

describe('kategorije', () => {
  it('izbor iz comboa upisuje vrednosti u formular', () => {
    const { model } = aktivan(update(kategorijeMsg(Combo.selected([B, C])), open()))
    expect(model.value.kategorije).toStrictEqual([B, C])
  })

  it('uklanjanje poslednje kategorije vraca formular u nevalidno stanje', () => {
    const sKategorijama = aktivan(update(kategorijeMsg(Combo.selected([B])), withValue(popunjen))).model
    const { model } = aktivan(update(kategorijeMsg(Combo.selected([])), sKategorijama))
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
