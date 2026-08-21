import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FUNKCIONALNOSTI, emptyAuthorization, type AuthorizationConfig } from '../../../../auth/types'
import { init, view } from '../index'

const SVE: AuthorizationConfig = { funkcionalnosti: [...FUNKCIONALNOSTI] }

const draw = (config: AuthorizationConfig): string =>
  renderToStaticMarkup(view(config, init({}, undefined)[0])(() => {}))

describe('dugme za kreiranje', () => {
  it('stoji kad korisnik sme da kreira', () => {
    expect(draw(SVE)).toContain('Novi vozac')
  })

  // Jedini cuvar: poruka moze da stigne samo odavde, pa se u update-u ne proverava ponovo.
  it('nema ga bez funkcionalnosti', () => {
    expect(draw(emptyAuthorization)).not.toContain('Novi vozac')
  })
})
