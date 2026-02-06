import { Data } from 'effect'
import type { AuthorizationConfig } from '../auth/types'

export type Msg = Data.TaggedEnum<{
  ToggleDrawer: { readonly isOpen: boolean }
  ToggleCategory: { readonly categoryKey: string }
  AuthorizationChanged: { readonly config: AuthorizationConfig }
}>

export const Msg = Data.taggedEnum<Msg>()

export const toggleDrawer = (isOpen: boolean): Msg => Msg.ToggleDrawer({ isOpen })
export const toggleCategory = (categoryKey: string): Msg => Msg.ToggleCategory({ categoryKey })
export const authorizationChanged = (config: AuthorizationConfig): Msg => Msg.AuthorizationChanged({ config })
