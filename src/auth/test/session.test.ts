import { describe, expect, it } from 'vitest'
import { Session, canResume, sameIdentity } from '../session'

const PERA: Session = {
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: ['PretragaVozaca', 'KreiranjeVozaca'],
  expiration: 1_000_000,
}

const DIFFERENT: ReadonlyArray<readonly [string, Session]> = [
  ['korisnik', { ...PERA, korisnik: { ...PERA.korisnik, id: 2 } }],
  ['uloga', { ...PERA, uloga: 'REFERENT' }],
  ['funkcionalnosti', { ...PERA, funkcionalnosti: ['PretragaVozaca'] }],
]

describe('identitet sesije', () => {
  it('pomeren rok je ista sesija', () => {
    expect(sameIdentity(PERA, { ...PERA, expiration: PERA.expiration + 60_000 })).toBe(true)
  })

  it('svako polje seme osim isteka ulazi u identitet', () => {
    const covered = DIFFERENT.map(([polje]) => polje)
    const expected = Object.keys(Session.fields).filter(polje => polje !== 'expiration')
    expect([...covered].sort()).toStrictEqual([...expected].sort())

    for (const [polje, drugacija] of DIFFERENT) {
      expect(sameIdentity(PERA, drugacija), polje).toBe(false)
    }
  })

  it('redosled ovlascenja se racuna kao razlika', () => {
    expect(sameIdentity(PERA, { ...PERA, funkcionalnosti: ['KreiranjeVozaca', 'PretragaVozaca'] })).toBe(false)
  })
})

describe('nastavak zapamcene sesije', () => {
  it('rok u buducnosti uz kolacic prolazi', () => {
    expect(canResume(PERA, PERA.expiration - 1, true)).toBe(true)
  })

  it('bez kolacica ne prolazi ni ziva sesija', () => {
    expect(canResume(PERA, PERA.expiration - 1, false)).toBe(false)
  })

  it('istekla sesija ne prolazi ni sa kolacicem', () => {
    expect(canResume(PERA, PERA.expiration, true)).toBe(false)
  })
})
