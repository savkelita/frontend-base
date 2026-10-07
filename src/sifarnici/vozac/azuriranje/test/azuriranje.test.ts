import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../common/domain/combo'
import { ApiError } from '../../../../common/error'
import * as Form from '../../../../common/form'
import type { VozacInfo } from '../../../api'
import type { Value as Kategorija } from '../../../domain/kategorija-vozaca'
import { init, toCmd, update, type Result } from '../index'
import { sameForm, vForm, type FormValue, type Model } from '../model'
import { changed, closed, kategorijeMsg, receiveFailed, received, saveFailed, saved, submitted } from '../msg'

const B: Kategorija = { id: 1, oznaka: 'B' }
const C: Kategorija = { id: 2, oznaka: 'C' }

const vozac: VozacInfo = {
  id: 7,
  version: 3,
  ime: 'Pera',
  prezime: 'Peric',
  imeZaPrikaz: 'Pera Peric',
  email: 'pera@primer.rs',
  telefon: '38163123456',
  kategorije: [B],
  stanje: 'AKTIVAN',
}

const aktivan = (result: Result) => {
  if (result._tag !== 'Active') throw new Error(`ocekivan Active, a stigao ${result._tag}`)
  return result
}

const ucitan = (): Model => aktivan(update(received(vozac), init(7)[0])).model

const spreman = (model: Model) => {
  if (model._tag !== 'Ready') throw new Error('model nije Ready')
  return model
}

const izmenjen = (fields: Partial<FormValue>): Model =>
  aktivan(update(changed({ ...spreman(ucitan()).value, ...fields }), ucitan())).model

describe('ucitavanje', () => {
  it('pocinje praznim ekranom i trazi slog', () => {
    const [model, cmd] = init(7)
    expect(model._tag).toBe('Loading')
    expect(cmd).not.toBe(Cmd.none)
  })

  it('odgovor puni formu zatecenim vrednostima', () => {
    expect(spreman(ucitan()).value).toStrictEqual({
      ime: 'Pera',
      prezime: 'Peric',
      imeZaPrikaz: 'Pera Peric',
      email: 'pera@primer.rs',
      telefon: '38163123456',
      kategorije: [B],
      stanje: 'AKTIVAN',
    })
  })

  it('neuspelo ucitavanje zavrsi u gresci', () => {
    const { model } = aktivan(update(receiveFailed(ApiError.NotFound()), init(7)[0]))
    expect(model._tag).toBe('Failed')
  })

  it('poruke forme pre ucitavanja otpadaju', () => {
    const prazan = init(7)[0]
    expect(aktivan(update(submitted(), prazan)).model).toBe(prazan)
    expect(aktivan(update(changed({} as FormValue), prazan)).model).toBe(prazan)
  })
})

describe('snimanje', () => {
  it('nepotpuna forma pali greske i ne zove server', () => {
    const { model, cmd } = aktivan(update(submitted(), izmenjen({ ime: null })))
    expect(spreman(model).showErrors).toBe(true)
    expect(spreman(model).isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('ispravna forma ide na server', () => {
    const { model, cmd } = aktivan(update(submitted(), ucitan()))
    expect(spreman(model).isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('dvoklik ne salje dva puta', () => {
    const uToku = aktivan(update(submitted(), ucitan())).model
    const { model, cmd } = aktivan(update(submitted(), uToku))
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska servera ostaje u modelu', () => {
    const uToku = aktivan(update(submitted(), ucitan())).model
    const { model } = aktivan(update(saveFailed(ApiError.ServerFailure()), uToku))
    expect(spreman(model).isSubmitting).toBe(false)
    expect(spreman(model).error._tag).toBe('Some')
  })

  it('izmena polja sklanja gresku servera', () => {
    const sGreskom = aktivan(update(saveFailed(ApiError.ServerFailure()), ucitan())).model
    const { model } = aktivan(update(changed({ ...spreman(sGreskom).value, ime: 'Mika' }), sGreskom))
    expect(spreman(model).error._tag).toBe('None')
  })

  it('uspeh javlja ekranu iznad da je gotovo', () => {
    const uToku = aktivan(update(submitted(), ucitan())).model
    expect(update(saved(), uToku)._tag).toBe('Done')
  })

  it('odustajanje javlja ekranu iznad da zatvori dijalog', () => {
    expect(update(closed(), ucitan())._tag).toBe('Closed')
  })
})

describe('komanda', () => {
  it('nosi id i verziju zatecenog sloga', () => {
    const result = Form.validate(vForm, spreman(ucitan()).value)
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(vozac, result.value)).toMatchObject({ id: 7, version: 3 })
  })

  it('kategorije se svode na id-eve', () => {
    const model = aktivan(update(kategorijeMsg(Combo.selected([B, C])), ucitan())).model
    const result = Form.validate(vForm, spreman(model).value)
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(vozac, result.value).kategorije).toStrictEqual([1, 2])
  })

  it('stanje se moze promeniti, za razliku od kreiranja', () => {
    const model = izmenjen({ stanje: 'PASIVAN' })
    const result = Form.validate(vForm, spreman(model).value)
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(vozac, result.value).stanje).toBe('PASIVAN')
  })
})

describe('izmenjenost', () => {
  const zatecena = (): FormValue => spreman(ucitan()).value

  it('netaknuta forma je jednaka zatecenoj', () => {
    expect(sameForm(zatecena(), zatecena())).toBe(true)
  })

  it('svako polje se racuna', () => {
    expect(sameForm(zatecena(), { ...zatecena(), ime: 'Mika' })).toBe(false)
    expect(sameForm(zatecena(), { ...zatecena(), email: null })).toBe(false)
    expect(sameForm(zatecena(), { ...zatecena(), stanje: 'PASIVAN' })).toBe(false)
    expect(sameForm(zatecena(), { ...zatecena(), kategorije: [B, C] })).toBe(false)
    expect(sameForm(zatecena(), { ...zatecena(), kategorije: [] })).toBe(false)
  })

  it('redosled kategorija nije izmena', () => {
    const forma = { ...zatecena(), kategorije: [B, C] }
    expect(sameForm(forma, { ...forma, kategorije: [C, B] })).toBe(true)
  })
})
