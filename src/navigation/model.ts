import type { NavigationEntry } from './types'

export type Model = {
  readonly entries: ReadonlyArray<NavigationEntry>
  readonly isOpen: boolean
  readonly openCategories: ReadonlyArray<string>
}
