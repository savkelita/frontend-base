import { Arbitrary, FastCheck, Option } from 'effect'
import * as Router from 'tea-effect/Router'
import { describe, expect, it } from 'vitest'
import { ioDirection, ioEnumPredicate, ioStringOperator } from '../../../../common/pretraga'
import { routes } from '../../../../router/route'
import { ioVozacOrder } from '../../../api'
import * as StanjeVozaca from '../../../domain/stanje-vozaca'
import type { init } from '../index'

type Query = Parameters<typeof init>[0]

// Podrazumevani generator daje & = ? # % + i razmak, ali ostaje u ASCII-ju.
// Vozaci se zovu Secerovic i Djordjevic, pa i to mora da prodje kroz adresu.
const tekst = FastCheck.oneof(
  FastCheck.string(),
  FastCheck.string({ unit: 'grapheme' }),
  FastCheck.constantFrom(
    'Šećerović',
    'Đorđević',
    'Živković',
    'Ћирилица',
    'Pera Perić',
    'contains',
    '%41',
    'a+b',
    'ime=contains&ime=Mika',
    '#',
    '?',
    '&',
    '=',
    '../..',
    '😀',
  ),
)

const stringPredicate = FastCheck.tuple(Arbitrary.make(ioStringOperator), tekst)

const upit: FastCheck.Arbitrary<Query> = FastCheck.record(
  {
    offset: FastCheck.nat(),
    kategorijaID: FastCheck.nat(),
    order: Arbitrary.make(ioVozacOrder),
    dir: Arbitrary.make(ioDirection),
    ime: stringPredicate,
    prezime: stringPredicate,
    imeZaPrikaz: stringPredicate,
    email: stringPredicate,
    telefon: stringPredicate,
    stanje: Arbitrary.make(ioEnumPredicate(StanjeVozaca.ioValue)),
  },
  { requiredKeys: [] },
)

const krozAdresu = (query: Query): Query | null => {
  const url = Router.format(routes.vozaci, query)
  const [pathname, search] = url.split('?')
  const parsed = Router.parse(routes, { pathname: pathname ?? '', search: search === undefined ? '' : `?${search}` })
  if (!Option.isSome(parsed) || parsed.value._tag !== 'vozaci') return null
  return parsed.value.query
}

describe('adresa nosi upit bez gubitka', () => {
  it('sto se upise u adresu, to se iz nje i procita', () => {
    FastCheck.assert(
      FastCheck.property(upit, query => {
        expect(krozAdresu(query)).toStrictEqual(query)
      }),
      { numRuns: 500 },
    )
  })
})
