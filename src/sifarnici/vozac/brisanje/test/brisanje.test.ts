import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../../common/error'
import type { Vozac } from '../../../api'
import { init, update } from '../index'
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

describe('brisanje', () => {
  it('otvara se bez pitanja servera', () => {
    const [model, cmd] = init(vozac)
    expect(model.vozac).toBe(vozac)
    expect(model.isDeleting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('potvrda salje zahtev', () => {
    const [model, cmd] = update(submitted(), otvoreno())
    expect(model.isDeleting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('dvoklik ne salje dva puta', () => {
    const uToku = update(submitted(), otvoreno())[0]
    const [model, cmd] = update(submitted(), uToku)
    expect(model).toBe(uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('greska ostaje u modelu i dijalog se ne gasi', () => {
    const uToku = update(submitted(), otvoreno())[0]
    const [model] = update(deleteFailed(ApiError.BadRequest({ errors: [] })), uToku)
    expect(model.isDeleting).toBe(false)
    expect(model.error._tag).toBe('Some')
  })

  // Posle neuspeha korisnik moze da pokusa ponovo; stara greska tada nema sta da trazi.
  it('ponovni pokusaj cisti prethodnu gresku', () => {
    const sGreskom = update(deleteFailed(ApiError.ServerFailure()), update(submitted(), otvoreno())[0])[0]
    const [model] = update(submitted(), sGreskom)
    expect(model.error._tag).toBe('None')
    expect(model.isDeleting).toBe(true)
  })

  it('uspeh gasi brisanje, a ekran iznad gasi dijalog', () => {
    const uToku = update(submitted(), otvoreno())[0]
    const [model, cmd] = update(deleted(), uToku)
    expect(model.isDeleting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('odustajanje ne dira model', () => {
    const model = otvoreno()
    expect(update(closed(), model)[0]).toBe(model)
  })

  it('pocinje bez greske', () => {
    expect(Option.isNone(otvoreno().error)).toBe(true)
  })
})
