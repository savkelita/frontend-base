import type * as Http from 'tea-effect/Http'
import { ApiError } from './types'

export * from './types'

// -------------------------------------------------------------------------------------
// mapHttpError
// -------------------------------------------------------------------------------------

export const mapHttpError = (error: Http.HttpError): ApiError => {
  switch (error._tag) {
    case 'BadStatus':
      switch (error.status) {
        case 400:
          return ApiError.BadRequest()
        case 401:
          return ApiError.Unauthorized()
        case 404:
          return ApiError.NotFound()
        default:
          return ApiError.UnexpectedError({ message: `HTTP ${error.status}` })
      }
    case 'Timeout':
    case 'NetworkError':
      return ApiError.NetworkError()
    default:
      return ApiError.UnexpectedError({ message: error._tag })
  }
}
