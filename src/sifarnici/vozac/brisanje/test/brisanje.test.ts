import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../../common/error'
import type { Vozac } from '../../../api'
import { init, update, type Result } from '../index'
import type { Model } from '../model'
import { closed, deleteFailed, deleted, submitted } from '../msg'

const vozac: Vozac = {
  id: 7,
  version: 3,
  ime: 'Pera',
  prezime: 'Peric',
  imeZaPrikaz: 'Pera Peric',
  email: null,
  telefon: null,
  kategorije: [{ id: 1, oznaka: 'B' }],
  stanje: 'AKTIVAN',
  audit: {
    korisnikKreirao: { ime: 'Petar', prezime: 'Petrovic' },
    datumKreiranja: new Date(2026, 7, 12, 9, 14),
    korisnikPromenio: null,
    datumPromene: null,
  },
}

const otvoreno = (): Model => init(vozac)[0]

const aktivan = (result: Result) => {
  if (result._tag !== 'Active') throw new Error(`ocekivan Active, a stigao ${result._tag}`)
  return result
}

const gotov = (result: Result): Vozac => {
  if (result._tag !== 'Done') throw new Error(`ocekivan Done, a stigao ${result._tag}`)
  return result.value
}

describe('brisanje', () => {
  it('otvara se bez pitanja servera', () => {
    const [model, cmd] = init(vozac)
    expect(model.vozac).toBe(vozac)
    expect(model.isDeleting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('potvrda salje zahtev', () => {
    const { model, cmd } = aktivan(update(submitted(), otvoreno()))
    expect(model.isDeleting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('dvoklik ne salje dva puta', () => {
    const uToku = aktivan(update(submitted(), otvoreno())).model
    const { model, cmd } = aktivan(update(submitted(), uToku))
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska ostaje u modelu i dijalog se ne gasi', () => {
    const uToku = aktivan(update(submitted(), otvoreno())).model
    const { model } = aktivan(update(deleteFailed(ApiError.BadRequest({ errors: [] })), uToku))
    expect(model.isDeleting).toBe(false)
    expect(model.error._tag).toBe('Some')
  })

  // Posle neuspeha korisnik moze da pokusa ponovo; stara greska tada nema sta da trazi.
  it('ponovni pokusaj cisti prethodnu gresku', () => {
    const uToku = aktivan(update(submitted(), otvoreno())).model
    const sGreskom = aktivan(update(deleteFailed(ApiError.ServerFailure()), uToku)).model
    const { model } = aktivan(update(submitted(), sGreskom))
    expect(model.error._tag).toBe('None')
    expect(model.isDeleting).toBe(true)
  })

  it('uspeh javlja ekranu iznad koga je obrisao', () => {
    const uToku = aktivan(update(submitted(), otvoreno())).model
    expect(gotov(update(deleted(), uToku))).toBe(vozac)
  })

  it('odustajanje javlja ekranu iznad da zatvori dijalog', () => {
    expect(update(closed(), otvoreno())._tag).toBe('Closed')
  })

  it('pocinje bez greske', () => {
    expect(Option.isNone(otvoreno().error)).toBe(true)
  })
})
