import { describe, expect, it } from 'vitest'
import { Session, canResume, sameIdentity } from '../session'

const PERA: Session = {
  korisnik: { id: 1, ime: 'Pera', prezime: 'Peric', korisnickoIme: 'pera', email: 'p@p.rs' },
  uloga: 'ADMINISTRATOR',
  funkcionalnosti: ['PretragaVozaca', 'KreiranjeVozaca'],
  istek: 1_000_000,
}

const DRUGACIJE: ReadonlyArray<readonly [string, Session]> = [
  ['korisnik', { ...PERA, korisnik: { ...PERA.korisnik, id: 2 } }],
  ['uloga', { ...PERA, uloga: 'REFERENT' }],
  ['funkcionalnosti', { ...PERA, funkcionalnosti: ['PretragaVozaca'] }],
]

describe('identitet sesije', () => {
  // Ovo je grana kojom ce proci produzenje sesije: isti covek, pomeren rok, ekran se ne rusi.
  it('pomeren rok je ista sesija', () => {
    expect(sameIdentity(PERA, { ...PERA, istek: PERA.istek + 60_000 })).toBe(true)
  })

  // Smisao izvodjenja iz seme. Novo polje u Session obara prvu tvrdnju i trazi da se ovde dopise,
  // umesto da tiho ostane van poredjenja kao kod rucno pisanog uslova.
  it('svako polje seme osim isteka ulazi u identitet', () => {
    const pokrivena = DRUGACIJE.map(([polje]) => polje)
    const ocekivana = Object.keys(Session.fields).filter(polje => polje !== 'istek')
    expect([...pokrivena].sort()).toStrictEqual([...ocekivana].sort())

    for (const [polje, drugacija] of DRUGACIJE) {
      expect(sameIdentity(PERA, drugacija), polje).toBe(false)
    }
  })

  // Niz se poredi po redosledu. Ako se server ikada pokaze nedeterministickim, resenje je
  // Equivalence.mapInput sa sortiranjem, kao kod sameForm u azuriranju.
  it('redosled ovlascenja se racuna kao razlika', () => {
    expect(sameIdentity(PERA, { ...PERA, funkcionalnosti: ['KreiranjeVozaca', 'PretragaVozaca'] })).toBe(false)
  })
})

describe('nastavak zapamcene sesije', () => {
  it('rok u buducnosti uz kolacic prolazi', () => {
    expect(canResume(PERA, PERA.istek - 1, true)).toBe(true)
  })

  it('bez kolacica ne prolazi ni ziva sesija', () => {
    expect(canResume(PERA, PERA.istek - 1, false)).toBe(false)
  })

  it('istekla sesija ne prolazi ni sa kolacicem', () => {
    expect(canResume(PERA, PERA.istek, true)).toBe(false)
  })
})
