import { Data } from 'effect'
import type * as Navigation from 'tea-effect/Navigation'
import type * as Nav from '../navigation'
import type { Sesija } from '../auth/session'
import type * as SesijaUnit from '../auth/sesija'
import type * as Login from '../login'
import type { Pismo } from '../common/strings'
import type { ScreenModel } from './screen-model'

// Писмо стоји у сваком стању: бира се и пре пријаве, а екран грешке при подизању нема
// модел уопште — зато га тамо нема ни кога да мења.
export type Model = Data.TaggedEnum<{
  Initializing: { readonly location: Navigation.Location; readonly pismo: Pismo }
  Anonymous: { readonly login: Login.Model; readonly pismo: Pismo }
  Authenticated: {
    readonly session: Sesija
    readonly sesija: SesijaUnit.Model
    readonly location: Navigation.Location
    readonly screen: ScreenModel
    readonly navigation: Nav.Model
    readonly pismo: Pismo
  }
}>

/** Писмо ма из ког стања — заглавље и корени вид га траже без гранања. */
export const pismoIz = (model: Model): Pismo => model.pismo

export const Model = Data.taggedEnum<Model>()
