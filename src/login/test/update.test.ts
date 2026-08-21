import { Either, Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { describe, expect, it } from 'vitest'
import { IdentifikujResponse } from '../../auth/api/types'
import type { Uloge } from '../../auth/domain/uloga'
import { ApiError } from '../../common/error'
import * as Form from '../../common/form'
import { init, update } from '../index'
import { Step, vFormKorisnik, vFormUloga, type Model } from '../model'
import { Msg, changeKorisnik, changeUloga, identified, submitKorisnik, submitUloga } from '../msg'

const [initial] = init

const korisnikModel = (form: { korisnickoIme: string | null; lozinka: string | null }): Model => ({
  ...initial,
  step: Step.Korisnik({ form }),
})

const ulogaModel = (uloge: Uloge): Model => ({
  ...initial,
  step: Step.Uloga({ form: { uloga: null }, uloge }),
})

describe('prvi korak: korisnicko ime i lozinka', () => {
  it('pocinje na koraku korisnika, bez zahteva', () => {
    expect(initial.step._tag).toBe('Korisnik')
    expect(init[1]).toBe(Cmd.none)
  })

  it('prazna forma nije ispravna', () => {
    expect(Form.validate(vFormKorisnik, { korisnickoIme: null, lozinka: null }).isValid).toBe(false)
  })

  it('slanje prazne forme pali greske i ne salje zahtev', () => {
    const [model, cmd] = update(submitKorisnik(), korisnikModel({ korisnickoIme: null, lozinka: null }))
    expect(model.showErrors).toBe(true)
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('slanje popunjene forme salje zahtev i pali indikator', () => {
    const [model, cmd] = update(submitKorisnik(), korisnikModel({ korisnickoIme: 'pera', lozinka: 'tajna' }))
    expect(model.isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('kucanje brise gresku sa prethodnog pokusaja', () => {
    const failed: Model = {
      ...korisnikModel({ korisnickoIme: null, lozinka: null }),
      error: Option.some(ApiError.Unauthorized()),
    }
    const [model] = update(changeKorisnik({ korisnickoIme: 'p', lozinka: null }), failed)
    expect(Option.isNone(model.error)).toBe(true)
  })
})

describe('izmedju koraka', () => {
  // Bira se samo kad ima sta da se bira.
  it('jedna uloga preskace ekran izbora i odmah salje prijavu', () => {
    const [model, cmd] = update(identified(['REFERENT']), { ...initial, isSubmitting: true })
    expect(model.step._tag).toBe('Korisnik')
    expect(model.isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('vise uloga vodi na ekran izbora, bez zahteva', () => {
    const [model, cmd] = update(identified(['ADMINISTRATOR', 'REFERENT']), { ...initial, isSubmitting: true })
    expect(model.step._tag).toBe('Uloga')
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('prelazak na izbor gasi greske prvog koraka', () => {
    const [model] = update(identified(['ADMINISTRATOR', 'REFERENT']), { ...initial, showErrors: true })
    expect(model.showErrors).toBe(false)
  })

  /**
   * Nalog bez uloge BE odbija poslovnim pravilom, pa prazna lista ne stize kao stanje
   * nego kao odgovor koji ne postuje dogovor — i pada jos pri dekodovanju.
   */
  it('prazna lista uloga nije ispravan odgovor', () => {
    expect(Either.isLeft(Schema.decodeUnknownEither(IdentifikujResponse)({ uloge: [] }))).toBe(true)
    expect(Either.isRight(Schema.decodeUnknownEither(IdentifikujResponse)({ uloge: ['REFERENT'] }))).toBe(true)
  })

  it('neuspela identifikacija gasi indikator i pamti gresku', () => {
    const [model, cmd] = update(Msg.IdentifyFailed({ error: ApiError.Unauthorized() }), {
      ...initial,
      isSubmitting: true,
    })
    expect(model.isSubmitting).toBe(false)
    expect(Option.isSome(model.error)).toBe(true)
    expect(cmd).toBe(Cmd.none)
  })
})

describe('drugi korak: izbor uloge', () => {
  it('ponuda su samo uloge koje je server vratio', () => {
    const schema = vFormUloga(['REFERENT'])
    expect(Form.validate(schema, { uloga: 'REFERENT' }).isValid).toBe(true)
    expect(Form.validate(schema, { uloga: 'ADMINISTRATOR' }).isValid).toBe(false)
  })

  it('prazan izbor nije ispravan', () => {
    expect(Form.validate(vFormUloga(['ADMINISTRATOR', 'REFERENT']), { uloga: null }).isValid).toBe(false)
  })

  it('slanje bez izbora pali greske i ne salje zahtev', () => {
    const [model, cmd] = update(submitUloga(), ulogaModel(['ADMINISTRATOR', 'REFERENT']))
    expect(model.showErrors).toBe(true)
    expect(cmd).toBe(Cmd.none)
  })

  it('slanje sa izborom salje prijavu', () => {
    const chosen: Model = {
      ...initial,
      step: Step.Uloga({ form: { uloga: 'REFERENT' }, uloge: ['ADMINISTRATOR', 'REFERENT'] }),
    }
    const [model, cmd] = update(submitUloga(), chosen)
    expect(model.isSubmitting).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('izbor uloge brise gresku', () => {
    const failed: Model = { ...ulogaModel(['ADMINISTRATOR', 'REFERENT']), error: Option.some(ApiError.Unauthorized()) }
    const [model] = update(changeUloga({ uloga: 'REFERENT' }), failed)
    expect(Option.isNone(model.error)).toBe(true)
  })

  // Poruka pripada koraku na kome je nastala.
  it('poruka prvog koraka ne stize do drugog', () => {
    const [model] = update(
      changeKorisnik({ korisnickoIme: 'p', lozinka: null }),
      ulogaModel(['ADMINISTRATOR', 'REFERENT']),
    )
    expect(model.step._tag).toBe('Uloga')
  })
})

describe('kraj prijave', () => {
  const session = {
    korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
    uloga: 'REFERENT' as const,
    funkcionalnosti: ['PretragaVozaca'],
  }

  it('uspeh nosi sesiju i gasi indikator', () => {
    const [model, cmd] = update(Msg.LoginSucceeded({ session }), { ...initial, isSubmitting: true })
    expect(Option.isSome(model.result)).toBe(true)
    expect(model.isSubmitting).toBe(false)
    expect(cmd).toBe(Cmd.none)
  })

  it('neuspeh ne otvara sesiju', () => {
    const [model] = update(Msg.LoginFailed({ error: ApiError.Unauthorized() }), { ...initial, isSubmitting: true })
    expect(Option.isNone(model.result)).toBe(true)
    expect(Option.isSome(model.error)).toBe(true)
  })
})
