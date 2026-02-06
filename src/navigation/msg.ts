import { Data } from 'effect'

export type Msg = Data.TaggedEnum<{
  ToggleDrawer: { readonly isOpen: boolean }
  ToggleCategory: { readonly categoryKey: string }
}>

export const Msg = Data.taggedEnum<Msg>()

export const toggleDrawer = (isOpen: boolean): Msg => Msg.ToggleDrawer({ isOpen })
export const toggleCategory = (categoryKey: string): Msg => Msg.ToggleCategory({ categoryKey })
