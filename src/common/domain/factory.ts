import { Schema, ParseResult } from 'effect'
import type { SchemaAST } from 'effect'

// -------------------------------------------------------------------------------------
// Field schema factories
// -------------------------------------------------------------------------------------
//
// Pure effect/Schema builders. Two cross-cutting concerns baked in for all of them:
//   - `optional`  : an empty value ("" / []) is valid.
//   - `validate`  : a custom rule run on the decoded value when present; return a message
//                   string to fail, or undefined to pass.
// (Which widget renders a field is decided by the forms builders in src/common/forms,
// not here — these are just schemas.)

export type BaseOpts<A> = {
  readonly optional?: boolean
  readonly validate?: (value: A) => string | undefined
}

const REQUIRED = 'Obavezno polje'

// --- string-backed (text, date/time, single enum, single combo) ---

export type StringOpts = BaseOpts<string> & {
  readonly max?: number
  readonly oneOf?: readonly string[]
}

export const stringField = (opts: StringOpts = {}): Schema.Schema<string, string> =>
  Schema.String.pipe(
    Schema.filter(value => {
      if (value === '') return opts.optional ? undefined : REQUIRED
      if (opts.max != null && value.length > opts.max) return `Najviše ${opts.max} karaktera`
      if (opts.oneOf && !opts.oneOf.includes(value)) return 'Nedozvoljena vrednost'
      return opts.validate?.(value)
    }),
  )

// --- number-backed (int, decimal): draft is the raw string, payload is a number ---

export type NumberOpts = BaseOpts<number> & {
  readonly integer?: boolean
  readonly min?: number
  readonly max?: number
}

const parseNumber = (opts: NumberOpts, input: string, ast: SchemaAST.AST) => {
  const n = Number(input.trim().replace(',', '.'))
  if (!Number.isFinite(n)) return ParseResult.fail(new ParseResult.Type(ast, input, 'Unesite broj'))
  if (opts.integer && !Number.isInteger(n))
    return ParseResult.fail(new ParseResult.Type(ast, input, 'Unesite ceo broj'))
  if (opts.min != null && n < opts.min)
    return ParseResult.fail(new ParseResult.Type(ast, input, `Mora biti veće ili jednako ${opts.min}`))
  if (opts.max != null && n > opts.max)
    return ParseResult.fail(new ParseResult.Type(ast, input, `Mora biti manje ili jednako ${opts.max}`))
  const custom = opts.validate?.(n)
  if (custom) return ParseResult.fail(new ParseResult.Type(ast, input, custom))
  return ParseResult.succeed(n)
}

export const requiredNumber = (opts: NumberOpts): Schema.Schema<number, string> =>
  Schema.transformOrFail(Schema.String, Schema.Number, {
    strict: true,
    decode: (input, _options, ast) =>
      input.trim() === ''
        ? ParseResult.fail(new ParseResult.Type(ast, input, REQUIRED))
        : parseNumber(opts, input, ast),
    encode: value => ParseResult.succeed(String(value)),
  })

export const optionalNumber = (opts: NumberOpts): Schema.Schema<number | undefined, string> =>
  Schema.transformOrFail(Schema.String, Schema.UndefinedOr(Schema.Number), {
    strict: true,
    decode: (input, _options, ast) =>
      input.trim() === '' ? ParseResult.succeed(undefined) : parseNumber(opts, input, ast),
    encode: value => ParseResult.succeed(value === undefined ? '' : String(value)),
  })

// --- boolean (flag) ---

export const boolField = (opts: BaseOpts<boolean> = {}): Schema.Schema<boolean, boolean> =>
  opts.validate ? Schema.Boolean.pipe(Schema.filter(v => opts.validate?.(v))) : Schema.Boolean

// --- multi-value (multi enum, multi combo): draft is string[] ---

export type MultiOpts = BaseOpts<readonly string[]> & {
  readonly oneOf?: readonly string[]
}

export const multiField = (opts: MultiOpts = {}): Schema.Schema<readonly string[], readonly string[]> =>
  Schema.Array(Schema.String).pipe(
    Schema.filter(values => {
      if (values.length === 0) return opts.optional ? undefined : 'Izaberite bar jednu vrednost'
      if (opts.oneOf && values.some(v => !opts.oneOf!.includes(v))) return 'Nedozvoljena vrednost'
      return opts.validate?.(values)
    }),
  )
