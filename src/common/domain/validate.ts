import { Either, ParseResult, Schema } from 'effect'

// -------------------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------------------
//
// A single source of truth used by both the view (to display messages) and update (to
// gate submission). Errors are keyed by the top-level field name via effect's
// ArrayFormatter — no brittle indexing into parser internals.

export type FormErrors = Readonly<Record<string, string>>

/**
 * Decodes a draft into the strongly-typed domain payload, or reports the parse error.
 * On success the value is fully branded/typed and ready to send to the API.
 */
export const decode = <A, I>(schema: Schema.Schema<A, I>, draft: I): Either.Either<A, ParseResult.ParseError> =>
  Schema.decodeEither(schema, { errors: 'all' })(draft)

/**
 * Field-keyed error messages for a draft. Empty object means the draft is valid.
 * Only the first message per field is kept (what the input renders).
 */
export const errorsOf = <A, I>(schema: Schema.Schema<A, I>, draft: I): FormErrors =>
  Either.match(decode(schema, draft), {
    onRight: () => ({}),
    onLeft: error => {
      const acc: Record<string, string> = {}
      for (const issue of ParseResult.ArrayFormatter.formatErrorSync(error)) {
        const field = issue.path[0]
        if (field !== undefined && !(String(field) in acc)) {
          acc[String(field)] = issue.message
        }
      }
      return acc
    },
  })
