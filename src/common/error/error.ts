import { Data, Option, Schema } from 'effect'
import type * as Http from 'tea-effect/Http'

export const Severity = Schema.Literal('ERROR', 'WARNING')

export type Severity = typeof Severity.Type

export const BusinessError = Schema.Struct({
  type: Schema.Literal('BUSINESS'),
  code: Schema.String,
  messageCode: Schema.String,
  message: Schema.String,
  severity: Severity,
})

export const SystemError = Schema.Struct({
  type: Schema.Literal('SYSTEM'),
  code: Schema.String,
  message: Schema.String,
})

export const PreconditionError = Schema.Struct({
  type: Schema.Literal('PRECONDITION'),
  message: Schema.String,
})

export const ServerError = Schema.Union(BusinessError, SystemError, PreconditionError)

export type ServerError = typeof ServerError.Type

const ServerErrors = Schema.parseJson(Schema.Array(ServerError))

export const parseErrors = (body: string): ReadonlyArray<ServerError> =>
  Option.getOrElse(Option.getRight(Schema.decodeUnknownEither(ServerErrors)(body)), () => [])

export type ApiError = Data.TaggedEnum<{
  BadRequest: { readonly errors: ReadonlyArray<ServerError> }
  Unauthorized: {}
  NotFound: {}
  ServerFailure: {}
  Unavailable: {}
  Timeout: {}
  UnexpectedStatus: { readonly status: number }
  NetworkError: {}
  BadResponse: {}
  BadRequestPayload: {}
}>

export const ApiError = Data.taggedEnum<ApiError>()

const fromStatus = (status: number, body: string): ApiError => {
  switch (status) {
    case 400:
      return ApiError.BadRequest({ errors: parseErrors(body) })
    case 401:
      return ApiError.Unauthorized()
    case 404:
      return ApiError.NotFound()
    case 500:
      return ApiError.ServerFailure()
    case 503:
      return ApiError.Unavailable()
    case 504:
      return ApiError.Timeout()
    default:
      return ApiError.UnexpectedStatus({ status })
  }
}

export const mapHttpError = (error: Http.HttpError): ApiError => {
  switch (error._tag) {
    case 'BadStatus':
      return fromStatus(error.status, error.body)
    case 'Timeout':
      return ApiError.Timeout()
    case 'NetworkError':
      return ApiError.NetworkError()
    case 'BadBody':
      return ApiError.BadResponse()
    case 'BadUrl':
    case 'BadRequestBody':
      return ApiError.BadRequestPayload()
  }
}
