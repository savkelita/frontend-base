import * as Http from 'tea-effect/Http'
import { env } from '../../common/env'
import { ProductsResponse } from './types'
import type { ProductsResponse as ProductsResponseType } from './types'

// -------------------------------------------------------------------------------------
// Get Products
// -------------------------------------------------------------------------------------

export const getProducts: Http.Request<ProductsResponseType> = Http.get(
  `${env.apiBaseUrl}/products`,
  Http.expectJson(ProductsResponse),
)
