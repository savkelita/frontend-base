import { describe, expect, it } from 'vitest'
import { emptyAuthorization, hasAllFunkcionalnosti, hasFunkcionalnost } from '../types'

describe('ovlascenja', () => {
  const config = { funkcionalnosti: ['PretragaVozaca'] }

  it('prepoznaje funkcionalnost koju je server poslao', () => {
    expect(hasFunkcionalnost(config, 'PretragaVozaca')).toBe(true)
  })

  it('odbija funkcionalnost koje nema', () => {
    expect(hasFunkcionalnost(emptyAuthorization, 'PretragaVozaca')).toBe(false)
  })

  // Pocetna strana nije vezana ni za jednu funkcionalnost.
  it('prazan zahtev prolazi i bez ijednog prava', () => {
    expect(hasAllFunkcionalnosti(emptyAuthorization, [])).toBe(true)
  })

  it('trazi sve navedene, ne bilo koju', () => {
    expect(hasAllFunkcionalnosti(config, ['PretragaVozaca'])).toBe(true)
    expect(hasAllFunkcionalnosti({ funkcionalnosti: [] }, ['PretragaVozaca'])).toBe(false)
  })

  // Server sme da posalje i ono sto frontend jos ne poznaje.
  it('nepoznata funkcionalnost sa servera ne smeta', () => {
    expect(hasFunkcionalnost({ funkcionalnosti: ['NestoNovo', 'PretragaVozaca'] }, 'PretragaVozaca')).toBe(true)
  })
})
