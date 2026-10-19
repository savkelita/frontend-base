import { Option, Schema } from 'effect'
import * as FastCheck from 'fast-check'
import * as Router from 'tea-effect/Router'
import { describe, expect, it } from 'vitest'
import { ioDirection, ioEnumOperator, ioStringOperator, type EnumOperator } from '../../../../common/pretraga'
import { isList } from '../../../../common/pretraga/operator'
import { routes } from '../../../../router/route'
import { ioVozacOrder } from '../../../api'
import * as StanjeVozaca from '../../../domain/stanje-vozaca'
import type { init } from '../index'

type Query = Parameters<typeof init>[0]

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

const stringPredicate = FastCheck.tuple(FastCheck.constantFrom(...ioStringOperator.literals), tekst)
const enumPredicate = <A extends string>(
  value: Schema.Literals<ReadonlyArray<A>>,
): FastCheck.Arbitrary<readonly [EnumOperator, ...Array<A>]> =>
  FastCheck.tuple(
    FastCheck.constantFrom(...ioEnumOperator.literals),
    FastCheck.constantFrom(...value.literals),
    FastCheck.array(FastCheck.constantFrom(...value.literals), { maxLength: 3 }),
  ).map(([operator, first, rest]) => [operator, first, ...(isList(operator) ? rest : [])] as const)

const upit: FastCheck.Arbitrary<Query> = FastCheck.record(
  {
    offset: FastCheck.nat(),
    kategorijaID: FastCheck.nat(),
    order: FastCheck.constantFrom(...ioVozacOrder.literals),
    dir: FastCheck.constantFrom(...ioDirection.literals),
    ime: stringPredicate,
    prezime: stringPredicate,
    imeZaPrikaz: stringPredicate,
    email: stringPredicate,
    telefon: stringPredicate,
    stanje: enumPredicate(StanjeVozaca.ioValue),
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
