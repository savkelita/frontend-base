import { Schema } from 'effect'
import type { SelectOption } from '../forms/widgets'
import { t } from '../strings'
import { enumOf, multiEnumOf } from './enumeration'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// defineEnum — једна декларација енумерације, из ње се изводи све
// -------------------------------------------------------------------------------------
//
// Улаз је запис `вредност -> ознака`, исти облик који затечени пројекти зову `keys`. Из
// њега се изводе:
//
//   .Value        шема за декодовање вредности са жице (уска унија, не `string`)
//   .values       дозвољене вредности
//   .labelOf(v)   ознака у текућем писму
//   .opcije       понуђене вредности за поље избора, редоследом из `keys`
//   .field()      поље форме (једна вредност) / .multiField() (више њих)
//
// Ознаке се пишу ћирилицом, као и сав остали текст; `.opcije` их НЕ пресловљава — то ради
// вид при исцртавању, да прекидач писма важи и за листу која је састављена при увозу
// модула. `.labelOf` се зове при исцртавању, па пресловљава одмах.

export type EnumKeys = Readonly<Record<string, string>>

export type EnumDef<V extends string> = {
  readonly keys: Readonly<Record<V, string>>
  readonly values: ReadonlyArray<V>
  readonly Value: Schema.Schema<V>
  readonly labelOf: (value: V) => string
  readonly opcije: ReadonlyArray<SelectOption>
  readonly field: (opts?: BaseOpts<string>) => Schema.Schema<string, string>
  readonly multiField: (opts?: BaseOpts<readonly string[]>) => Schema.Schema<readonly string[], readonly string[]>
}

export const defineEnum = <const K extends EnumKeys>(keys: K): EnumDef<keyof K & string> => {
  type V = keyof K & string
  const values = Object.keys(keys) as ReadonlyArray<V>
  return {
    keys: keys as Readonly<Record<V, string>>,
    values,
    // `S.Literal` са раширеним низом даје унију тих вредности; тип низа је овде већ узак,
    // али TypeScript то кроз spread не преноси сам.
    Value: Schema.Literal(...values) as unknown as Schema.Schema<V>,
    labelOf: value => t(keys[value] ?? value),
    opcije: values.map(value => ({ value, label: keys[value] })),
    field: opts => enumOf(values, opts),
    multiField: opts => multiEnumOf(values, opts),
  }
}
