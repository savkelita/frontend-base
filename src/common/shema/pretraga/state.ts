import { Option, Schema } from 'effect'

export const stateValue =
  <A, I>(schema: Schema.Schema<A, I>) =>
  (state: unknown): A | undefined =>
    Option.getOrUndefined(Schema.decodeUnknownOption(schema)(state))
