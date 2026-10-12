import { describe, expect, it } from 'vitest'
import { emptyAuthorization, hasAllPermissions, hasPermission } from '../types'

describe('ovlascenja', () => {
  const config = { permissions: ['PretragaVozaca'] }

  it('prepoznaje funkcionalnost koju je server poslao', () => {
    expect(hasPermission(config, 'PretragaVozaca')).toBe(true)
  })

  it('odbija funkcionalnost koje nema', () => {
    expect(hasPermission(emptyAuthorization, 'PretragaVozaca')).toBe(false)
  })

  it('prazan zahtev prolazi i bez ijednog prava', () => {
    expect(hasAllPermissions(emptyAuthorization, [])).toBe(true)
  })

  it('trazi sve navedene, ne bilo koju', () => {
    expect(hasAllPermissions(config, ['PretragaVozaca'])).toBe(true)
    expect(hasAllPermissions({ permissions: [] }, ['PretragaVozaca'])).toBe(false)
  })

  it('nepoznata funkcionalnost sa servera ne smeta', () => {
    expect(hasPermission({ permissions: ['NestoNovo', 'PretragaVozaca'] }, 'PretragaVozaca')).toBe(true)
  })
})
