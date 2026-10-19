import { Effect, Schema, SchemaIssue } from 'effect'

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

export const ioValue: Schema.Codec<Date> = Schema.declareConstructor<Date>()(
  [],
  () => (input, _ast, options) => {
    if (input instanceof Date) return Effect.succeed(input)
    if (typeof input !== 'string')
      return Effect.fail(new SchemaIssue.InvalidValue({ message: 'Ocekivan je datum' }, input, options))
    const date = fromYmd(input)
    return date === null
      ? Effect.fail(new SchemaIssue.InvalidValue({ message: 'Ocekivan je datum oblika YYYY-MM-DD' }, input, options))
      : Effect.succeed(date)
  },
  { identifier: 'Date' },
)
