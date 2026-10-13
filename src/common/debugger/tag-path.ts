type Tagged = { readonly _tag: string }

const isTagged = (value: unknown): value is Tagged =>
  typeof value === 'object' && value !== null && '_tag' in value && typeof value._tag === 'string'

const tags = (msg: Tagged): ReadonlyArray<string> => {
  const fields: ReadonlyArray<unknown> = Object.values(msg)
  const inner = fields.find(isTagged)
  return inner === undefined ? [msg._tag] : [msg._tag, ...tags(inner)]
}

export const tagPath = (msg: Tagged): string => tags(msg).join('/')
