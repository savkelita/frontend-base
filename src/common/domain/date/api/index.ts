import { ParseResult, Schema } from 'effect'

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (n: number): string => String(n).padStart(2, '0')

export const toYmd = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const fromYmd = (text: string): Date | null => {
  const m = text.match(YMD)
  if (m === null) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export const format = (date: Date): string => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`

export const ioValue: Schema.Schema<Date> = Schema.declare(
  [],
  {
    decode: () => (input, _options, ast) => {
      if (input instanceof Date) return ParseResult.succeed(input)
      if (typeof input !== 'string') return ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je datum'))
      const date = fromYmd(input)
      return date === null
        ? ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je datum oblika YYYY-MM-DD'))
        : ParseResult.succeed(date)
    },
    encode: () => (input, _options, ast) =>
      input instanceof Date
        ? ParseResult.succeed(input)
        : ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je Date')),
  },
  { identifier: 'Date' },
)
