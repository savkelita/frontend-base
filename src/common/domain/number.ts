import { Schema } from 'effect'
import { requiredNumber, optionalNumber } from './factory'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// Numeric types (backend: int / decimal)
// -------------------------------------------------------------------------------------
//
// The draft holds the raw string the user types; the payload is a real number. Optional
// variants decode an empty input to `undefined` (omitted from the JSON body).

export type IntOpts = BaseOpts<number> & { readonly min?: number; readonly max?: number }
export type DecimalOpts = IntOpts & { readonly decimals?: number }

export function int(opts?: IntOpts & { readonly optional?: false }): Schema.Schema<number, string>
export function int(opts: IntOpts & { readonly optional: true }): Schema.Schema<number | undefined, string>
export function int(opts: IntOpts = {}) {
  return opts.optional ? optionalNumber({ ...opts, integer: true }) : requiredNumber({ ...opts, integer: true })
}

export function decimal(opts?: DecimalOpts & { readonly optional?: false }): Schema.Schema<number, string>
export function decimal(opts: DecimalOpts & { readonly optional: true }): Schema.Schema<number | undefined, string>
export function decimal(opts: DecimalOpts = {}) {
  return opts.optional ? optionalNumber(opts) : requiredNumber(opts)
}
