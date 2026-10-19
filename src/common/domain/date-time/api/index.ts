import { Effect, Schema, SchemaIssue } from 'effect'

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

export const ioValue: Schema.Codec<Date> = Schema.declareConstructor<Date>()(
  [],
  () => (input, _ast, options) => {
    if (input instanceof Date) return Effect.succeed(input)
    if (typeof input !== 'string')
      return Effect.fail(new SchemaIssue.InvalidValue({ message: 'Ocekivan je DateTime' }, input, options))
    const date = fromIso(input)
    return date === null
      ? Effect.fail(
          new SchemaIssue.InvalidValue({ message: 'Ocekivan je DateTime oblika YYYY-MM-DDTHH:mm:ss' }, input, options),
        )
      : Effect.succeed(date)
  },
  { identifier: 'DateTime' },
)
