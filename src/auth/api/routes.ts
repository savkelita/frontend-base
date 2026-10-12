import * as Http from 'tea-effect/Http'
import { expectNoContent, post } from '../../common/http/request'
import type * as Uloga from '../domain/uloga'
import { IdentifikujCmd, IdentifikujResponse, LoginCmd, LoginResponse } from './types'

export const identifikuj = (cmd: IdentifikujCmd): Http.Request<typeof IdentifikujResponse.Type> =>
  post('/api/administracija/identifikuj', Http.jsonBody(IdentifikujCmd, cmd), Http.expectJson(IdentifikujResponse))

export const login = (uloga: Uloga.Value): Http.Request<LoginResponse> =>
  post('/api/administracija/login', Http.jsonBody(LoginCmd, { uloga }), Http.expectJson(LoginResponse))

export const logout: Http.Request<void> = post('/api/administracija/logout', Http.emptyBody, expectNoContent)
