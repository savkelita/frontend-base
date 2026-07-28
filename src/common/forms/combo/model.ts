import type { SelectOption } from '../widgets/select'

// -------------------------------------------------------------------------------------
// Combo model — async select as a proper TEA unit (single or multi)
// -------------------------------------------------------------------------------------
//
// All async state lives here (not in a React component): the current query, the loaded
// options, loading/error flags, and the selection. `seq` is a request counter used to
// drop stale responses when the user types quickly. `selected` is an array so the same
// unit serves both single-select (0/1 element) and multi-select (N elements).

export type Model = {
  readonly query: string
  readonly options: ReadonlyArray<SelectOption>
  /** Total rows matching the query on the server. `options` holds the pages loaded so far. */
  readonly total: number
  /** Popup open state (controlled, so "load more" can keep the list open). */
  readonly open: boolean
  readonly loading: boolean
  readonly failed: boolean
  /** Chosen options: 0/1 for a single combo, N for a multi combo. */
  readonly selected: ReadonlyArray<SelectOption>
  readonly seq: number
}

export const init: Model = {
  query: '',
  options: [],
  total: 0,
  open: false,
  loading: false,
  failed: false,
  selected: [],
  seq: 0,
}

/** Seed a single combo with a preselected option (edit screens): its label shows in the input. */
export const withSelected = (option: SelectOption): Model => ({ ...init, selected: [option], query: option.label })

/** Seed a multi combo with preselected options (edit screens). */
export const withSelectedMany = (options: ReadonlyArray<SelectOption>): Model => ({ ...init, selected: options })

/** The single-select value (first chosen id), or '' when nothing is chosen. */
export const value = (model: Model): string => model.selected[0]?.value ?? ''

/** The multi-select values (all chosen ids). */
export const values = (model: Model): ReadonlyArray<string> => model.selected.map(o => o.value)

export const hasSelection = (model: Model): boolean => model.selected.length > 0

export const isSelected = (model: Model, value: string): boolean => model.selected.some(o => o.value === value)
