import { describe, expect, it } from 'vitest'
import { getRouteFunkcionalnosti } from '../../router/route'
import { buildNavigation } from '../config'

const kljucevi = (funkcionalnosti: ReadonlyArray<string>): ReadonlyArray<string> =>
  buildNavigation({ funkcionalnosti }).map(entry => entry.key)

describe('meni prema funkcionalnostima', () => {
  // Bez ovoga bi korisnik posle prijave ostao bez ijedne stavke i bez pocetne strane.
  it('pocetna se vidi i kad server nije poslao nijednu funkcionalnost', () => {
    expect(kljucevi([])).toContain('home')
  })

  it('nepoznata funkcionalnost sa servera ne otvara nista novo', () => {
    expect(kljucevi(['NestoDrugo'])).toStrictEqual(kljucevi([]))
  })
})

describe('prava po ruti', () => {
  it('pocetna ne trazi nista', () => {
    expect(getRouteFunkcionalnosti('home')).toStrictEqual([])
  })

  // Nepostojeca ruta se ne testira jer je tip ne dozvoljava; propust se vidi na kompajleru.
  it('svaka ruta ima svoj spisak', () => {
    expect(getRouteFunkcionalnosti('vozaci')).toStrictEqual(['PretragaVozaca'])
    expect(getRouteFunkcionalnosti('vozila')).toStrictEqual(['PretragaVozila'])
  })
})
