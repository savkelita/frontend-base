import { Data } from 'effect'

// -------------------------------------------------------------------------------------
// ApiError
// -------------------------------------------------------------------------------------

export type ApiError = Data.TaggedEnum<{
  BadRequest: {}
  Unauthorized: {}
  NotFound: {}
  NetworkError: {}
  UnexpectedError: { readonly message: string }
}>

export const ApiError = Data.taggedEnum<ApiError>()
