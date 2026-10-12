import { ParseResult, Schema } from 'effect'

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/

const pad = (n: number): string => String(n).padStart(2, '0')

export const fromIso = (text: string): Date | null => {
  const m = text.match(ISO)
  if (m === null) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const [hours, minutes, seconds] = [Number(m[4]), Number(m[5]), Number(m[6] ?? '0')]
  const date = new Date(year, month - 1, day, hours, minutes, seconds)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export const toIso = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

export const format = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`

export const ioValue: Schema.Schema<Date> = Schema.declare(
  [],
  {
    decode: () => (input, _options, ast) => {
      if (input instanceof Date) return ParseResult.succeed(input)
      if (typeof input !== 'string') return ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je DateTime'))
      const date = fromIso(input)
      return date === null
        ? ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je DateTime oblika YYYY-MM-DDTHH:mm:ss'))
        : ParseResult.succeed(date)
    },
    encode: () => (input, _options, ast) =>
      input instanceof Date
        ? ParseResult.succeed(input)
        : ParseResult.fail(new ParseResult.Type(ast, input, 'Ocekivan je Date')),
  },
  { identifier: 'DateTime' },
)
