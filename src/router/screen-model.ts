import { Data } from 'effect'
import type * as Home from '../home'
import type * as Products from '../products'

export type ScreenModel = Data.TaggedEnum<{
  HomeScreen: { readonly model: Home.Model }
  ProductsScreen: { readonly model: Products.Model }
  NotFoundScreen: { readonly path: string }
  UnauthorizedScreen: { readonly path: string }
}>

export const ScreenModel = Data.taggedEnum<ScreenModel>()

export const homeScreen = (model: Home.Model): ScreenModel => ScreenModel.HomeScreen({ model })
export const productsScreen = (model: Products.Model): ScreenModel => ScreenModel.ProductsScreen({ model })
export const notFoundScreen = (path: string): ScreenModel => ScreenModel.NotFoundScreen({ path })
export const unauthorizedScreen = (path: string): ScreenModel => ScreenModel.UnauthorizedScreen({ path })
