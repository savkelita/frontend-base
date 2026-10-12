import { describe, expect, it } from 'vitest'
import { routePermissions } from '../../router/route'
import { buildNavigation } from '../config'

const keys = (permissions: ReadonlyArray<string>): ReadonlyArray<string> =>
  buildNavigation({ permissions }).map(entry => entry.key)

describe('meni prema funkcionalnostima', () => {
  it('pocetna se vidi i kad server nije poslao nijednu funkcionalnost', () => {
    expect(keys([])).toContain('home')
  })

  it('nepoznata funkcionalnost sa servera ne otvara nista novo', () => {
    expect(keys(['NestoDrugo'])).toStrictEqual(keys([]))
  })
})

describe('prava po ruti', () => {
  it('pocetna ne trazi nista', () => {
    expect(routePermissions('home')).toStrictEqual([])
  })

  it('svaka ruta ima svoj spisak', () => {
    expect(routePermissions('vozaci')).toStrictEqual(['PretragaVozaca'])
    expect(routePermissions('vozila')).toStrictEqual(['PretragaVozila'])
  })
})
