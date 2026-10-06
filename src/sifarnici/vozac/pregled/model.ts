import { Data as Tagged } from 'effect'
import type { ApiError } from '../../../common/error'
import type { VozacInfo } from '../../api'
import type * as Vozila from './vozila'

export type Model = Tagged.TaggedEnum<{
  Loading: { readonly id: number }
  Ready: { readonly vozac: VozacInfo; readonly vozila: Vozila.Model }
  Failed: { readonly id: number; readonly error: ApiError }
}>

export const Model = Tagged.taggedEnum<Model>()
