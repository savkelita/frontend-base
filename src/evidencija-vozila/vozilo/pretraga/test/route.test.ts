import { Arbitrary, FastCheck, Option, Schema } from 'effect'
import * as Router from 'tea-effect/Router'
import { describe, expect, it } from 'vitest'
import {
  ioDateOperator,
  ioDirection,
  ioEnumOperator,
  ioStringOperator,
  type EnumOperator,
  type StringOperator,
} from '../../../../common/pretraga'
import { isList } from '../../../../common/pretraga/operator'
import { routes } from '../../../../router/route'
import { OZNAKA_OPERATORI, ioVoziloOrder } from '../../../api'
import * as IstekRegistracije from '../../../domain/istek-registracije'
import * as VoziloStanje from '../../../domain/vozilo-stanje'
import type { init } from '../index'

type Query = Parameters<typeof init>[0]

const tekst = FastCheck.oneof(
  FastCheck.string(),
  FastCheck.string({ unit: 'grapheme' }),
  FastCheck.constantFrom('BG 123-AA', 'NŠ-456-ББ', 'contains', '%41', 'a+b', '#', '?', '&', '=', '../..', '😀'),
)

const stringPredicate = FastCheck.tuple(Arbitrary.make(ioStringOperator), tekst)

const stringPredicateOf = (operators: ReadonlyArray<StringOperator>) =>
  FastCheck.tuple(FastCheck.constantFrom(...operators), tekst)
const enumPredicate = <A>(value: Schema.Schema<A>): FastCheck.Arbitrary<readonly [EnumOperator, ...Array<A>]> =>
  FastCheck.tuple(
    Arbitrary.make(ioEnumOperator),
    Arbitrary.make(value),
    FastCheck.array(Arbitrary.make(value), { maxLength: 3 }),
  ).map(([operator, first, rest]) => [operator, first, ...(isList(operator) ? rest : [])] as const)

const datePredicate = FastCheck.tuple(Arbitrary.make(ioDateOperator), tekst)

const upit: FastCheck.Arbitrary<Query> = FastCheck.record(
  {
    offset: FastCheck.nat(),
    order: Arbitrary.make(ioVoziloOrder),
    dir: Arbitrary.make(ioDirection),
    registarskaOznaka: stringPredicateOf(OZNAKA_OPERATORI),
    markaVozila: stringPredicate,
    modelVozila: stringPredicate,
    vrstaGorivaID: FastCheck.nat(),
    vrstaVozilaID: FastCheck.nat(),
    korisnikVozilaID: FastCheck.nat(),
    vozacID: FastCheck.nat(),
    datumPrveRegistracije: datePredicate,
    datumIsticanjaRegistracije: datePredicate,
    dostavljaMesecnuKm: FastCheck.boolean(),
    stanje: enumPredicate(VoziloStanje.ioValue),
    istekRegistracije: enumPredicate(IstekRegistracije.ioValue),
  },
  { requiredKeys: [] },
)

const krozAdresu = (query: Query): Query | null => {
  const url = Router.format(routes.vozila, query)
  const [pathname, search] = url.split('?')
  const parsed = Router.parse(routes, { pathname: pathname ?? '', search: search === undefined ? '' : `?${search}` })
  if (!Option.isSome(parsed) || parsed.value._tag !== 'vozila') return null
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
