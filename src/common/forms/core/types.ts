import type * as Http from 'tea-effect/Http'

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

/**
 * Jedna ponuđena vrednost u select ili combo polju.
 *
 * `data` nosi red iz koga je opcija nastala, pa forma može da izvede vrednost iz izabrane
 * opcije — faktor konverzije, oznaku jedinice mere — bez ponovnog dovlačenja.
 */
export type SelectOption<Data = unknown> = {
  readonly value: string
  readonly label: string
  readonly data?: Data
}

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
 * Изабрана вредност combo поља — оно што нацрт памти.
 *
 * `id` иде серверу. `label` је оно што поље приказује док листа није отворена; мора да се
 * памти, јер лабелу за већ изабрану вредност даје `Info` одговор, а он не носи иста поља
 * као ред претраге. `row` је цео ред и постоји само кад је вредност изабрана из листе —
 * из њега `derive` рачуна изведене вредности.
 */
export type ComboValue<Row = unknown> = {
  readonly id: string | number
  readonly label: string
  readonly row?: Row
}

const jeComboVrednost = (v: unknown): v is { readonly id: unknown } => typeof v === 'object' && v !== null && 'id' in v

/**
 * Поређење вредности поља. Два места где поређење по референци не ваља:
 *
 *  - вишезначна поља враћају НОВ низ при сваком читању, па би трајно била „измењена";
 *  - combo вредност је објекат који се пресоздаје, а иста је ако је исти `id` — лабела и
 *    ред су само оно што о том идентификатору тренутно знамо.
 */
export const sameValue = (a: unknown, b: unknown): boolean =>
  a === b ||
  // Идентификатор се пореди као текст: виџет га држи као текст, а запис уме да га донесе
  // као број — исти избор не сме да испадне измена.
  (jeComboVrednost(a) && jeComboVrednost(b) && String(a.id) === String(b.id)) ||
  (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => sameValue(x, b[i])))

/**
 * Извор опција за combo: рута коју претражује и мапирање реда у опцију.
 *
 * Ово је уговор између api слоја (који га прави) и форме (која га троши). Стоји овде да
 * форма не зна за платформу, а платформа увози само тип.
 */
export type ComboSource<Result = unknown, Criteria = Record<string, unknown>> = {
  /**
   * `extra` су критеријуми које combo прима поред откуцаног текста — оно што рута изриче
   * својом шемом. `offset` је редовни померај за страничење (0, па 10, 20, …).
   */
  readonly request: (extra: Criteria, query: string, offset: number) => Http.Request<any>
  readonly toOptions: (response: any) => ReadonlyArray<SelectOption<Result>>
  /** Колико редова укупно одговара упиту — од тога зависи „учитај још". */
  readonly total?: (response: any) => number
}
