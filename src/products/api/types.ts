import * as S from 'effect/Schema'
import type { BaseComboCriteria } from '../../common/pretraga'

// -------------------------------------------------------------------------------------
// Product
// -------------------------------------------------------------------------------------

export const Product = S.Struct({
  id: S.Number,
  title: S.String,
  category: S.String,
  price: S.Number,
  rating: S.Number,
  stock: S.Number,
  thumbnail: S.String,
})

export type Product = typeof Product.Type

// -------------------------------------------------------------------------------------
// ProductsResponse
// -------------------------------------------------------------------------------------

export const ProductsResponse = S.Struct({
  products: S.Array(Product),
  total: S.Number,
})

export type ProductsResponse = typeof ProductsResponse.Type

// -------------------------------------------------------------------------------------
// Create Product
// -------------------------------------------------------------------------------------

// Request body sent to the API. The product form decodes its draft into exactly this
// shape (see products/create/form.ts).
export const CreateProductBody = S.Struct({
  title: S.String,
  category: S.String,
  price: S.Number,
  stock: S.Number,
  datumNabavke: S.String,
  vremeIsporuke: S.optional(S.String),
  // terminIsporuke: a real Date (the form yields a Date once both date + time are entered).
  terminIsporuke: S.Date,
  // combo ids go to the backend as numbers.
  povezaniProizvod: S.optional(S.Number),
  povezaniProizvodi: S.Array(S.Number),
  // multi-enum values stay strings (they are codes, not ids).
  oznake: S.Array(S.String),
  grupa: S.optional(S.Number),
  podgrupa: S.optional(S.Number),
  description: S.optional(S.String),
  published: S.Boolean,
})

export type CreateProductBody = typeof CreateProductBody.Type

// The API echoes back the created product; we only need enough to confirm success.
export const CreatedProduct = S.Struct({
  id: S.Number,
  title: S.String,
})

export type CreatedProduct = typeof CreatedProduct.Type

// -------------------------------------------------------------------------------------
// Proizvod combo — criteria & result (search source for a product combo)
// -------------------------------------------------------------------------------------
//
// Analogous to Magacin: the combo's criteria and result types live next to the route,
// on the shared pretraga contract (see common/pretraga).

// Proizvod has no `sifra`, so its combo shows just `naziv` (the label fallback).
export const ProizvodComboResult = S.Struct({
  id: S.Number,
  naziv: S.String,
})
export type ProizvodComboResult = typeof ProizvodComboResult.Type
export type ProizvodComboCriteria = BaseComboCriteria

// -------------------------------------------------------------------------------------
// Cascading combos: Grupa -> Podgrupa (podgrupa is filtered by the chosen grupa)
// -------------------------------------------------------------------------------------
//
// Grupa/Podgrupa carry `sifra`, so their combos show `sifra - naziv` (the default label).

export const GrupaComboResult = S.Struct({ id: S.Number, sifra: S.String, naziv: S.String })
export type GrupaComboResult = typeof GrupaComboResult.Type
export type GrupaComboCriteria = BaseComboCriteria

export const PodgrupaComboResult = S.Struct({ id: S.Number, sifra: S.String, naziv: S.String })
export type PodgrupaComboResult = typeof PodgrupaComboResult.Type
export type PodgrupaComboCriteria = BaseComboCriteria & { readonly grupaID?: string }
