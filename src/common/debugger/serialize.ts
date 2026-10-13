import { Option, Schema } from 'effect'

export const REDACTED = '<redacted>'

const SECRET = /lozinka|password/i

const ioOption = Schema.Union(
  Schema.Struct({ _id: Schema.Literal('Option'), _tag: Schema.Literal('None') }),
  Schema.Struct({ _id: Schema.Literal('Option'), _tag: Schema.Literal('Some'), value: Schema.Unknown }),
)

const decodeOption = Schema.decodeUnknownOption(ioOption)

export const replacer = (key: string | number, value: unknown): unknown => {
  if (typeof key === 'string' && SECRET.test(key) && value !== null && value !== undefined) return REDACTED
  if (Option.isOption(value)) {
    return Option.isSome(value) ? { _id: 'Option', _tag: 'Some', value: value.value } : { _id: 'Option', _tag: 'None' }
  }
  return value
}

export const reviver = (_key: string, value: unknown): unknown =>
  typeof value !== 'object' || value === null || !('_id' in value)
    ? value
    : Option.match(decodeOption(value), {
        onNone: () => value,
        onSome: option => (option._tag === 'Some' ? Option.some(option.value) : Option.none()),
      })

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
  options: { date: true, undefined: true, map: true, set: true },
}

export type Serialize = typeof serialize
