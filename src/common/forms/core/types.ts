// -------------------------------------------------------------------------------------
// @tea-effect/forms — shared types
// -------------------------------------------------------------------------------------

export type Severity = 'error' | 'warning' | 'info'

export type Issue = {
  readonly path: ReadonlyArray<string>
  readonly message: string
  readonly severity: Severity
}

export type Mode = 'Create' | 'Edit' | 'View' | 'Copy'

/** Async (server) validation status held inside a field's state. */
export type Async =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Validating' }
  | { readonly _tag: 'Done'; readonly issues: ReadonlyArray<Issue> }

/** Everything a widget needs to render — all DERIVED, never stored. */
export type FieldUi = {
  readonly required: boolean
  readonly enabled: boolean
  readonly readonly: boolean
  readonly touched: boolean
  readonly dirty: boolean
  readonly validating: boolean
  readonly issues: ReadonlyArray<Issue>
}

/** Context passed to a field's update: resolved parent values + form mode. */
export type FieldCtx = {
  readonly deps: Record<string, unknown>
  readonly mode: Mode
}

export const topMessage = (issues: ReadonlyArray<Issue>): string | undefined =>
  (issues.find(i => i.severity === 'error') ?? issues[0])?.message

/**
 * Value equality for field values. Multi-value fields (multi enum/combo) hand out a NEW
 * array on every read, so reference equality would report them as permanently changed —
 * compare those element-wise instead.
 */
export const sameValue = (a: unknown, b: unknown): boolean =>
  a === b ||
  (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === (b as unknown[])[i]))
