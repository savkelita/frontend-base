import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { init, view } from '../index'

const markup = renderToStaticMarkup(view(init[0])(() => {}))

describe('prijava i autofill', () => {
  it('korisnicko ime trazi nalog', () => {
    expect(markup).toMatch(/autocomplete="username"/i)
  })

  it('lozinka trazi tekucu lozinku', () => {
    expect(markup).toMatch(/autocomplete="current-password"/i)
  })
})
