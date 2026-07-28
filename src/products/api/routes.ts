import * as Http from 'tea-effect/Http'
import { env } from '../../common/env'
import * as Pretraga from '../../common/pretraga'
import type { PretragaResponse } from '../../common/pretraga'
import {
  ProductsResponse,
  CreateProductBody,
  CreatedProduct,
  ProizvodComboResult,
  GrupaComboResult,
  PodgrupaComboResult,
} from './types'
import type {
  ProductsResponse as ProductsResponseType,
  CreateProductBody as CreateProductBodyType,
  CreatedProduct as CreatedProductType,
  ProizvodComboResult as ProizvodComboResultType,
  ProizvodComboCriteria,
  GrupaComboResult as GrupaComboResultType,
  GrupaComboCriteria,
  PodgrupaComboResult as PodgrupaComboResultType,
  PodgrupaComboCriteria,
} from './types'

// -------------------------------------------------------------------------------------
// Get Products
// -------------------------------------------------------------------------------------

export const getProducts: Http.Request<ProductsResponseType> = Http.get(
  `${env.apiBaseUrl}/products`,
  Http.expectJson(ProductsResponse),
)

// -------------------------------------------------------------------------------------
// Create Product
// -------------------------------------------------------------------------------------

export const createProduct = (body: CreateProductBodyType): Http.Request<CreatedProductType> =>
  Http.post(`${env.apiBaseUrl}/products/add`, Http.jsonBody(CreateProductBody, body), Http.expectJson(CreatedProduct))

// -------------------------------------------------------------------------------------
// Combo routes — GET pretrazi*Combo?{...PretragaRequest<Criteria>}
// -------------------------------------------------------------------------------------
//
// Plain request builders. The combo TEA unit (common/forms/combo) runs them as a `Cmd`
// via its Config.search; no impure Promise adapters here.

export const pretraziProizvodCombo = (
  criteria: ProizvodComboCriteria,
  offset = 0,
): Http.Request<PretragaResponse<ProizvodComboResultType>> =>
  Pretraga.comboRequest(`${env.apiBaseUrl}/products/pretraziProizvodCombo`, ProizvodComboResult, criteria, { offset })

export const pretraziGrupaCombo = (
  criteria: GrupaComboCriteria,
  offset = 0,
): Http.Request<PretragaResponse<GrupaComboResultType>> =>
  Pretraga.comboRequest(`${env.apiBaseUrl}/products/pretraziGrupaCombo`, GrupaComboResult, criteria, { offset })

export const pretraziPodgrupaCombo = (
  criteria: PodgrupaComboCriteria,
  offset = 0,
): Http.Request<PretragaResponse<PodgrupaComboResultType>> =>
  Pretraga.comboRequest(`${env.apiBaseUrl}/products/pretraziPodgrupaCombo`, PodgrupaComboResult, criteria, { offset })
