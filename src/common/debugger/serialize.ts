import { Option, Schema } from 'effect'

export const REDACTED = '<redacted>'

const SECRET = /lozinka|password/i

const ioMark = Schema.Union(
  Schema.Struct({ _id: Schema.Literal('Option'), _tag: Schema.Literal('None') }),
  Schema.Struct({ _id: Schema.Literal('Option'), _tag: Schema.Literal('Some'), value: Schema.Unknown }),
  Schema.Struct({ _id: Schema.Literal('Date'), value: Schema.NullOr(Schema.String) }),
)

type Mark = typeof ioMark.Type

const decodeMark = Schema.decodeUnknownOption(ioMark)

const unmark = (mark: Mark): unknown => {
  if (mark._id === 'Date') return new Date(mark.value ?? Number.NaN)
  return mark._tag === 'Some' ? Option.some(mark.value) : Option.none()
}

export const replacer = (key: string | number, value: unknown): unknown => {
  if (typeof key === 'string' && SECRET.test(key) && value !== null && value !== undefined) return REDACTED
  if (value instanceof Date) return { _id: 'Date', value: Number.isNaN(value.getTime()) ? null : value.toISOString() }
  if (Option.isOption(value)) {
    return Option.isSome(value) ? { _id: 'Option', _tag: 'Some', value: value.value } : { _id: 'Option', _tag: 'None' }
  }
  return value
}

export const reviver = (_key: string, value: unknown): unknown =>
  typeof value !== 'object' || value === null || !('_id' in value)
    ? value
    : Option.match(decodeMark(value), { onNone: () => value, onSome: unmark })

const isPlain = (value: object): boolean => {
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const reviveAny = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return value
  if (Array.isArray(value)) {
    const items = value.map(reviveAny)
    return items.some((item, index) => item !== value[index]) ? items : value
  }
  if (!isPlain(value)) return value
  const fields = Object.entries(value)
  const revived = fields.map(([key, field]) => [key, reviveAny(field)] as const)
  const changed = revived.some(([, field], index) => field !== fields[index]?.[1])
  return reviver('', changed ? Object.fromEntries(revived) : value)
}

export const revive = <A>(value: A): A => reviveAny(value) as A

export const serialize = {
  replacer,
  reviver,
  options: {},
}

export type Serialize = typeof serialize
