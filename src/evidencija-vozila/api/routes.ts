import * as Http from 'tea-effect/Http'
import { get } from '../../common/http/request'
import { ioPretragaResponse, withQuery, type PretragaRequest, type PretragaResponse } from '../../common/pretraga'
import { Vozilo, type VoziloCriteria, type VoziloOrder } from './types'

export const pretraziVozilo = (
  request: PretragaRequest<VoziloCriteria, VoziloOrder>,
): Http.Request<PretragaResponse<Vozilo>> =>
  get(withQuery('/api/evidencijavozila/pretraziVozilo', request), Http.expectJson(ioPretragaResponse(Vozilo)))
