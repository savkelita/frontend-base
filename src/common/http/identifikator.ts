import { Schema } from 'effect'

export const ObjekatIdentifikator = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
})

export type ObjekatIdentifikator = typeof ObjekatIdentifikator.Type
