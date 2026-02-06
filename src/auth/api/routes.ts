import { pipe } from 'effect'
import * as Http from 'tea-effect/Http'
import * as Task from 'tea-effect/Task'
import { env } from '../../common/env'
import type { ApiError } from '../../common/http'
import { mapHttpError } from '../../common/http'
import type { Session } from '../session'
import { LoginRequest, LoginResponse, RefreshRequest, RefreshResponse } from './types'
import type { Credentials, RefreshResult } from './types'

// -------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------

const EXPIRES_IN_MINS = 5
const HARDCODED_PERMISSIONS: ReadonlyArray<string> = ['home.view', 'products.view']

// -------------------------------------------------------------------------------------
// Login
// -------------------------------------------------------------------------------------

export const loginRequest = (credentials: Credentials): Http.Request<typeof LoginResponse.Type> =>
  Http.post(
    `${env.apiBaseUrl}/auth/login`,
    Http.jsonBody(LoginRequest, {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: EXPIRES_IN_MINS,
    }),
    Http.expectJson(LoginResponse),
  )

export const toSession = (response: typeof LoginResponse.Type): Session => ({
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
  username: response.username,
  permissions: [...HARDCODED_PERMISSIONS],
})

// -------------------------------------------------------------------------------------
// Refresh
// -------------------------------------------------------------------------------------

export const refresh = (refreshToken: string): Task.Task<RefreshResult, ApiError> =>
  pipe(
    Http.toTask(
      Http.post(
        `${env.apiBaseUrl}/auth/refresh`,
        Http.jsonBody(RefreshRequest, { refreshToken, expiresInMins: EXPIRES_IN_MINS }),
        Http.expectJson(RefreshResponse),
      ),
    ),
    Task.mapError(mapHttpError),
  )
