import * as Http from 'tea-effect/Http'
import type { Criteria as ComboCriteria } from '../../common/domain/combo'
import { ObjekatIdentifikator } from '../../common/http/identifikator'
import { expectNoContent, get, post } from '../../common/http/request'
import { ioPretragaResponse, withQuery, type PretragaRequest, type PretragaResponse } from '../../common/pretraga'
import {
  AzurirajVozacCmd,
  KategorijaVozackeDozvoleCombo,
  KorisnikVozilaCombo,
  KreirajVozacCmd,
  MarkaVozilaCombo,
  ModelVozilaCombo,
  Vozac,
  VozacCombo,
  VozacInfo,
  VrstaGorivaCombo,
  VrstaVozilaCombo,
  type ModelVozilaComboCriteria,
  type VozacCriteria,
  type VozacOrder,
} from './types'

export const pretraziVozac = (
  request: PretragaRequest<VozacCriteria, VozacOrder>,
): Http.Request<PretragaResponse<Vozac>> =>
  get(withQuery('/api/sifarnik/pretraziVozac', request), Http.expectJson(ioPretragaResponse(Vozac)))

export const kreirajVozac = (cmd: KreirajVozacCmd): Http.Request<ObjekatIdentifikator> =>
  post('/api/sifarnik/kreirajVozac', Http.jsonBody(KreirajVozacCmd, cmd), Http.expectJson(ObjekatIdentifikator))

export const dajVozac = (vozacID: number): Http.Request<VozacInfo> =>
  get(`/api/sifarnik/dajVozac/${vozacID}`, Http.expectJson(VozacInfo))

export const azurirajVozac = (cmd: AzurirajVozacCmd): Http.Request<void> =>
  post('/api/sifarnik/azurirajVozac', Http.jsonBody(AzurirajVozacCmd, cmd), expectNoContent)

export const obrisiVozac = (cmd: ObjekatIdentifikator): Http.Request<void> =>
  post('/api/sifarnik/obrisiVozac', Http.jsonBody(ObjekatIdentifikator, cmd), expectNoContent)

export const pretraziKategorijaVozackeDozvoleCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<KategorijaVozackeDozvoleCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziKategorijaVozackeDozvoleCombo', request),
    Http.expectJson(ioPretragaResponse(KategorijaVozackeDozvoleCombo)),
  )

export const pretraziMarkaVozilaCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<MarkaVozilaCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziMarkaVozilaCombo', request),
    Http.expectJson(ioPretragaResponse(MarkaVozilaCombo)),
  )

export const pretraziModelVozilaCombo = (
  request: PretragaRequest<ModelVozilaComboCriteria, never>,
): Http.Request<PretragaResponse<ModelVozilaCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziModelVozilaCombo', request),
    Http.expectJson(ioPretragaResponse(ModelVozilaCombo)),
  )

export const pretraziVrstaGorivaCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<VrstaGorivaCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziVrstaGorivaCombo', request),
    Http.expectJson(ioPretragaResponse(VrstaGorivaCombo)),
  )

export const pretraziVrstaVozilaCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<VrstaVozilaCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziVrstaVozilaCombo', request),
    Http.expectJson(ioPretragaResponse(VrstaVozilaCombo)),
  )

export const pretraziKorisnikVozilaCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<KorisnikVozilaCombo>> =>
  get(
    withQuery('/api/sifarnik/pretraziKorisnikVozilaCombo', request),
    Http.expectJson(ioPretragaResponse(KorisnikVozilaCombo)),
  )

export const pretraziVozacCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<VozacCombo>> =>
  get(withQuery('/api/sifarnik/pretraziVozacCombo', request), Http.expectJson(ioPretragaResponse(VozacCombo)))
