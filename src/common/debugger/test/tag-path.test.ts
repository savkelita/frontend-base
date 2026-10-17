import { Option } from 'effect'
import { describe, expect, it } from 'vitest'
import { changeKorisnik, loginFailed } from '../../../login/msg'
import { login, screen, sessionLoaded } from '../../../router/msg'
import { vozaciMsg } from '../../../router/screen-msg'
import type * as Kategorija from '../../../sifarnici/domain/kategorija-vozaca'
import { cleared, kategorijaMsg } from '../../../sifarnici/vozac/pretraga/filter/msg'
import { filterMsg } from '../../../sifarnici/vozac/pretraga/msg'
import * as Combo from '../../domain/combo'
import { ApiError } from '../../error'
import { tagPath } from '../tag-path'

describe('putanja tagova', () => {
  it('prolazi kroz omotace do poruke ekrana', () => {
    expect(tagPath(screen(vozaciMsg(filterMsg(cleared()))))).toBe('Screen/VozaciMsg/FilterMsg/Cleared')
  })

  it('silazi i kroz combo u filteru', () => {
    expect(tagPath(screen(vozaciMsg(filterMsg(kategorijaMsg(Combo.typed<Kategorija.Value>('B'))))))).toBe(
      'Screen/VozaciMsg/FilterMsg/KategorijaMsg/Typed',
    )
  })

  it('ne nosi sadrzaj poruke, pa ni lozinku', () => {
    const path = tagPath(login(changeKorisnik({ korisnickoIme: 'pera', lozinka: 'tajna' })))

    expect(path).toBe('Login/ChangeKorisnik')
    expect(path).not.toContain('tajna')
  })

  it('kaze koja je greska stigla', () => {
    expect(tagPath(login(loginFailed(ApiError.Unauthorized({ errors: [] }))))).toBe('Login/LoginFailed/Unauthorized')
  })

  it('kaze da li je zapamcena sesija pronadjena', () => {
    expect(tagPath(sessionLoaded(Option.none()))).toBe('SessionLoaded/None')
  })
})
