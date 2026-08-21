import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import * as Combo from '../../../../common/domain/combo'
import { ApiError } from '../../../../common/error'
import * as Form from '../../../../common/form'
import type { VozacInfo } from '../../../api'
import type { Value as Kategorija } from '../../../domain/kategorija-vozaca'
import { init, toCmd, update } from '../index'
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

const ucitan = (): Model => update(received(vozac), init(7)[0])[0]

const spreman = (model: Model) => {
  if (model._tag !== 'Ready') throw new Error('model nije Ready')
  return model
}

const izmenjen = (fields: Partial<FormValue>): Model =>
  update(changed({ ...spreman(ucitan()).value, ...fields }), ucitan())[0]

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
    const [model] = update(receiveFailed(ApiError.NotFound()), init(7)[0])
    expect(model._tag).toBe('Failed')
  })

  // Bez sloga nema sta da se salje, pa poruke forme nemaju gde da se primene.
  it('poruke forme pre ucitavanja otpadaju', () => {
    const prazan = init(7)[0]
    expect(update(submitted(), prazan)[0]).toBe(prazan)
    expect(update(changed({} as FormValue), prazan)[0]).toBe(prazan)
  })
})

describe('snimanje', () => {
  it('nepotpuna forma pali greske i ne zove server', () => {
    const [model, cmd] = update(submitted(), izmenjen({ ime: null }))
    expect(spreman(model).showErrors).toBe(true)
    expect(spreman(model).isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('ispravna forma ide na server', () => {
    const [model, cmd] = update(submitted(), ucitan())
    expect(spreman(model).isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('dvoklik ne salje dva puta', () => {
    const uToku = update(submitted(), ucitan())[0]
    const [model, cmd] = update(submitted(), uToku)
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska servera ostaje u modelu', () => {
    const uToku = update(submitted(), ucitan())[0]
    const [model] = update(saveFailed(ApiError.ServerFailure()), uToku)
    expect(spreman(model).isSubmitting).toBe(false)
    expect(spreman(model).error._tag).toBe('Some')
  })

  it('izmena polja sklanja gresku servera', () => {
    const sGreskom = update(saveFailed(ApiError.ServerFailure()), ucitan())[0]
    const [model] = update(changed({ ...spreman(sGreskom).value, ime: 'Mika' }), sGreskom)
    expect(spreman(model).error._tag).toBe('None')
  })

  it('uspeh gasi snimanje, a ekran iznad gasi dijalog', () => {
    const uToku = update(submitted(), ucitan())[0]
    const [model, cmd] = update(saved(), uToku)
    expect(spreman(model).isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('odustajanje ne dira model', () => {
    const model = ucitan()
    expect(update(closed(), model)[0]).toBe(model)
  })
})

describe('komanda', () => {
  // Bez id-a i version-a BE ne zna koji slog menjamo ni od koje verzije.
  it('nosi id i verziju zatecenog sloga', () => {
    const result = Form.validate(vForm, spreman(ucitan()).value)
    expect(result.isValid).toBe(true)
    if (!result.isValid) return
    expect(toCmd(vozac, result.value)).toMatchObject({ id: 7, version: 3 })
  })

  it('kategorije se svode na id-eve', () => {
    const model = update(kategorijeMsg(Combo.selected([B, C])), ucitan())[0]
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

  // Kategorije su skup, ne niz — redosled klikanja ne sme da se broji kao izmena.
  it('redosled kategorija nije izmena', () => {
    const forma = { ...zatecena(), kategorije: [B, C] }
    expect(sameForm(forma, { ...forma, kategorije: [C, B] })).toBe(true)
  })
})
