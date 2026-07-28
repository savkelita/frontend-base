import { Schema, ParseResult } from 'effect'
import type { SchemaAST } from 'effect'
import { stringField } from './factory'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// Date & time types (backend: date / time / datetime)
// -------------------------------------------------------------------------------------
//
// Stored/sent as canonical strings; the widgets handle localized display:
//   - date     -> "YYYY-MM-DD"        (shown as dd.mm.yyyy)
//   - time     -> "HH:mm" / "HH:mm:ss" (24h; seconds optional)
//   - datetime -> "YYYY-MM-DDTHH:mm"
//
// Custom rules (e.g. "not in the future") run on the canonical string via `validate`.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const isRealDate = (value: string): boolean => {
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export type DateOpts = BaseOpts<string>
export type TimeOpts = BaseOpts<string> & { readonly seconds?: boolean }

/** Date, shown as dd.mm.yyyy, stored as "YYYY-MM-DD". */
export const date = (opts: DateOpts = {}) =>
  stringField({
    optional: opts.optional,
    validate: v => (ISO_DATE.test(v) && isRealDate(v) ? opts.validate?.(v) : 'Neispravan datum'),
  })

/** 24h time "HH:mm" (or "HH:mm:ss" when `seconds` is set). */
export const time = (opts: TimeOpts = {}) => {
  const re = opts.seconds ? /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/ : /^([01]\d|2[0-3]):[0-5]\d$/
  return stringField({
    optional: opts.optional,
    validate: v => (re.test(v) ? opts.validate?.(v) : 'Neispravno vreme'),
  })
}

// -------------------------------------------------------------------------------------
// datetime — combined date + time, decoded to a real `Date`
// -------------------------------------------------------------------------------------
//
// Draft (widget value) is the string "YYYY-MM-DDTHH:mm" (empty until BOTH date and time
// are entered). The payload is a `Date`, so the field only decodes when it is complete.

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/

const pad2 = (n: number) => String(n).padStart(2, '0')

const toDate = (s: string): Date => {
  const [datePart, timePart] = s.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

/** Canonical "YYYY-MM-DDTHH:mm" from a local Date (the widget's draft encoding). */
export const datetimeDraft = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`

export type DateTimeOpts = BaseOpts<Date>

// A complete date + time is required for the field to have a value; the payload is a Date.
// Overloaded on `optional` (required -> Date, optional -> Date | undefined); the impl returns
// a union so both overloads stay assignable (Schema is invariant in its type parameter).
export function datetime(opts: DateTimeOpts & { optional: true }): Schema.Schema<Date | undefined, string>
export function datetime(opts?: DateTimeOpts): Schema.Schema<Date, string>
export function datetime(
  opts: DateTimeOpts = {},
): Schema.Schema<Date, string> | Schema.Schema<Date | undefined, string> {
  const parse = (input: string, ast: SchemaAST.AST) => {
    const s = input.trim()
    if (!ISO_DATETIME.test(s)) return ParseResult.fail(new ParseResult.Type(ast, input, 'Unesite datum i vreme'))
    const dt = toDate(s)
    if (isNaN(dt.getTime())) return ParseResult.fail(new ParseResult.Type(ast, input, 'Neispravan datum i vreme'))
    const custom = opts.validate?.(dt)
    if (custom) return ParseResult.fail(new ParseResult.Type(ast, input, custom))
    return ParseResult.succeed(dt)
  }
  const encode = (value: Date | undefined) => ParseResult.succeed(value === undefined ? '' : datetimeDraft(value))

  return opts.optional
    ? Schema.transformOrFail(Schema.String, Schema.UndefinedOr(Schema.DateFromSelf), {
        strict: true,
        decode: (input, _options, ast) => (input.trim() === '' ? ParseResult.succeed(undefined) : parse(input, ast)),
        encode,
      })
    : Schema.transformOrFail(Schema.String, Schema.DateFromSelf, {
        strict: true,
        decode: (input, _options, ast) =>
          input.trim() === ''
            ? ParseResult.fail(new ParseResult.Type(ast, input, 'Obavezno polje'))
            : parse(input, ast),
        encode,
      })
}
