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

describe('labele na ekranu', () => {
  const markup = draw(SVE)

  it('svaka labela polja pokazuje na polje koje postoji', () => {
    const labels = [...markup.matchAll(/<label[^>]*fui-Field__label[^>]*>/g)].map(m => m[0])
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      const target = label.match(/\bfor="([^"]*)"/)?.[1]
      expect(target, label).toBeDefined()
      expect(markup, label).toMatch(new RegExp(`<[a-z]+[^>]*\\bid="${target}"`))
    }
  })
})

describe('autofill', () => {
  // Pretraga nije licni podatak korisnika, pa pregledac nema sta da nudi.
  it('nijedno polje filtera ne ostaje bez autocomplete-a', () => {
    for (const [tag] of draw(SVE).matchAll(/<input[^>]*>/g)) {
      expect(tag).toMatch(/\bautocomplete="/i)
    }
  })
})
