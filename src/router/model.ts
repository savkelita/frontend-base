import type * as Navigation from 'tea-effect/Navigation'
import type * as Nav from '../navigation'
import type { ScreenModel } from './screen-model'

export type Model = {
  readonly location: Navigation.Location
  readonly screen: ScreenModel
  readonly navigation: Nav.Model
}
