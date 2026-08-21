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

export const ioValue = Schema.transformOrFail(Schema.String, Schema.ValidDateFromSelf, {
  strict: true,
  decode: (text, _options, ast) => {
    const date = fromYmd(text)
    return date === null
      ? ParseResult.fail(new ParseResult.Type(ast, text, 'Ocekivan je datum u obliku YYYY-MM-DD'))
      : ParseResult.succeed(date)
  },
  encode: date => ParseResult.succeed(toYmd(date)),
})
