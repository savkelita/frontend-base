import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { choices, type Keys, type Value } from '../domain/enum'
import { enumFilterField, type EnumFilterForm } from '../domain/field/filter-field'
import { ENUM_OPERATORS, isList, type EnumOperator } from './operator'
import { ioEnumPredicateOf } from './predicate'

export type Operators = ReadonlyArray<EnumOperator>

export type Form<A extends string> = EnumFilterForm<A>

export const vForm = <K extends Keys>(
  keys: K,
  operators: Operators = ENUM_OPERATORS,
  only?: ReadonlyArray<Value<K>>,
) => {
  const list = choices(keys, only)
  return Schema.NullOr(
    ioEnumPredicateOf(Schema.Literal(...list.map(one => one.value)), operators).pipe(
      Annotation.template(enumFilterField(operators, list)),
    ),
  )
}

export const toCriteria = <A extends string>(form: Form<A>): readonly [EnumOperator, ...Array<A>] | undefined => {
  if (form === null) return undefined
  const [operator, ...chosen] = form
  if (chosen.length === 0) return undefined
  return isList(operator) ? [operator, ...chosen] : [operator, chosen[0] as A]
}
