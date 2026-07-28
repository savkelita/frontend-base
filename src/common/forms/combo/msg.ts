import { Data } from 'effect'
import type { SelectOption } from '../widgets/select'

export type Msg = Data.TaggedEnum<{
  Opened: {}
  Closed: {}
  QueryChanged: { readonly query: string }
  // Load the next page (append). Requested at row offset = number of rows loaded so far.
  LoadMore: {}
  // `offset` of the loaded page: 0 replaces the list (fresh query), > 0 appends (load more).
  Loaded: {
    readonly seq: number
    readonly options: ReadonlyArray<SelectOption>
    readonly total: number
    readonly offset: number
  }
  Failed: { readonly seq: number }
  // Single-select: replace the selection and close.
  Picked: { readonly option: SelectOption }
  Cleared: {}
  // Multi-select: add/remove one option, keeping the list open.
  Toggled: { readonly option: SelectOption }
  // Hydration: resolve the label(s) for preselected id(s) (edit mode). NOT a selection change,
  // so it never triggers dependency cascades.
  Resolved: { readonly option: SelectOption }
  ResolvedMany: { readonly options: ReadonlyArray<SelectOption> }
}>

export const Msg = Data.taggedEnum<Msg>()

/** True for the messages that change the selection (parents watch these to reset children). */
export const isSelectionChange = (msg: Msg): boolean =>
  msg._tag === 'Picked' || msg._tag === 'Cleared' || msg._tag === 'Toggled'
