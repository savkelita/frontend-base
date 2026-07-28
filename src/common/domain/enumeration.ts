import { stringField, multiField } from './factory'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// Enum types (backend: enum, single or multi) — a choice from known static values
// -------------------------------------------------------------------------------------
//
// The allowed values live in the schema; the option *labels* are supplied per field via
// the FieldConfig `config.options`.

/** Single choice from `values`. Draft/payload: string. */
export const enumOf = (values: readonly string[], opts: BaseOpts<string> = {}) =>
  stringField({ ...opts, oneOf: values })

/** Multiple choice from `values`. Draft/payload: string[]. */
export const multiEnumOf = (values: readonly string[], opts: BaseOpts<readonly string[]> = {}) =>
  multiField({ ...opts, oneOf: values })
