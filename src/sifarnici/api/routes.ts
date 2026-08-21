import * as Http from 'tea-effect/Http'
import type { Criteria as ComboCriteria } from '../../common/domain/combo'
import { ObjekatIdentifikator } from '../../common/http/identifikator'
import { get, post } from '../../common/http/request'
import { ioPretragaResponse, withQuery, type PretragaRequest, type PretragaResponse } from '../../common/pretraga'
import { KategorijaVozackeDozvoleCombo, KreirajVozacCmd, Vozac, type VozacCriteria, type VozacOrder } from './types'

export const pretraziVozac = (
  request: PretragaRequest<VozacCriteria, VozacOrder>,
): Http.Request<PretragaResponse<Vozac>> =>
  get(withQuery('/api/sifarnik/pretraziVozac', request), Http.expectJson(ioPretragaResponse(Vozac)))

export const kreirajVozac = (cmd: KreirajVozacCmd): Http.Request<ObjekatIdentifikator> =>
  post('/api/sifarnik/kreirajVozac', Http.jsonBody(KreirajVozacCmd, cmd), Http.expectJson(ObjekatIdentifikator))

export const pretraziKategorijaVozackeDozvoleCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<KategorijaVozackeDozvoleCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziKategorijaVozackeDozvoleCombo', request),
    Http.expectJson(ioPretragaResponse(KategorijaVozackeDozvoleCombo)),
  )
