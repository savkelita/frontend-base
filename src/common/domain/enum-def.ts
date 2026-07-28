import { Schema } from 'effect'
import type { SelectOption } from '../forms/widgets'
import { enumOf, multiEnumOf } from './enumeration'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// defineEnum — a single, reusable definition of an enum
// -------------------------------------------------------------------------------------
//
// Declares the allowed values AND their labels once, then derives everything from it:
//   - `.field()` / `.multiField()` — the schema field (single / multi)
//   - `.options`                   — FieldConfig `config.options` for the select widget
//   - `.values`                    — the raw allowed values
//   - `.labelOf(value)`            — value -> label (for tables, summaries, …)
//
// Share one `defineEnum(...)` across every form/screen that uses the enum, so the values
// are never repeated.

export type EnumDef<V extends string> = {
  readonly values: ReadonlyArray<V>
  readonly options: ReadonlyArray<SelectOption>
  readonly labelOf: (value: string) => string
  readonly field: (opts?: BaseOpts<string>) => Schema.Schema<string, string>
  readonly multiField: (opts?: BaseOpts<readonly string[]>) => Schema.Schema<readonly string[], readonly string[]>
}

export const defineEnum = <const T extends ReadonlyArray<{ readonly value: string; readonly label: string }>>(
  options: T,
): EnumDef<T[number]['value']> => {
  const values = options.map(o => o.value)
  const labels = new Map(options.map(o => [o.value, o.label]))
  return {
    values: values as ReadonlyArray<T[number]['value']>,
    options,
    labelOf: value => labels.get(value) ?? value,
    field: opts => enumOf(values, opts),
    multiField: opts => multiEnumOf(values, opts),
  }
}
