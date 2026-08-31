import { Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type { ReactElement } from 'react'
import * as Domain from '../domain'
import type { ComboSource } from '../pretraga'
import * as Combo from './combo'
import {
  TextWidget,
  NumberWidget,
  BoolWidget,
  SelectWidget,
  MultiSelectWidget,
  DateWidget,
  TimeWidget,
  DateTimeWidget,
} from './widgets'
import type { SelectOption, WidgetProps } from './widgets'
import type { FieldDef } from './core/field'
import { topMessage, sameValue } from './core/types'

// -------------------------------------------------------------------------------------
// Field builders — thin: pair an existing domain schema with an existing widget
// -------------------------------------------------------------------------------------

type Opt = { readonly optional?: boolean }
type NumOpt = Opt & { readonly min?: number; readonly max?: number }

/** A plain (non-async) field: State = Value, Msg = the new Value. */
type ValueField<E, A> = FieldDef<E, E, E, A>

const valueField = <A, E>(cfg: {
  readonly label: string
  readonly schema: Schema.Schema<A, E>
  readonly required: boolean
  readonly empty: E
  readonly widget: (props: WidgetProps<E>) => ReactElement
  readonly widgetConfig?: Record<string, unknown>
}): ValueField<E, A> => {
  const W = cfg.widget
  return {
    schema: cfg.schema,
    empty: cfg.empty,
    required: cfg.required,
    init: v => [v, Cmd.none],
    value: s => s,
    set: (_s, v) => v,
    update: (msg, _s) => [msg, Cmd.none],
    // Only a real edit counts: retyping the same text must not reset dependent fields or
    // re-run the form's effects.
    changed: (msg, previous) => !sameValue(msg, previous),
    view: (state, ui) => dispatch => (
      <W
        label={cfg.label}
        value={state}
        required={ui.required}
        disabled={!ui.enabled || ui.readonly}
        errorMessage={topMessage(ui.issues)}
        config={cfg.widgetConfig}
        onChange={v => dispatch(v)}
        onBlur={() => {}}
      />
    ),
  }
}

// Every builder takes a single config object with a `label` (consistent across all types).
type Labeled<O> = O & { readonly label: string }

// --- text ---
export const code10 = (cfg: Labeled<Opt>) =>
  valueField({ label: cfg.label, schema: Domain.code10(cfg), required: !cfg.optional, empty: '', widget: TextWidget })
export const code30 = (cfg: Labeled<Opt>) =>
  valueField({ label: cfg.label, schema: Domain.code30(cfg), required: !cfg.optional, empty: '', widget: TextWidget })
export const name = (cfg: Labeled<Opt>) =>
  valueField({ label: cfg.label, schema: Domain.name(cfg), required: !cfg.optional, empty: '', widget: TextWidget })
export const desc = (cfg: Labeled<Opt>) =>
  valueField({
    label: cfg.label,
    schema: Domain.desc(cfg),
    required: !cfg.optional,
    empty: '',
    widget: TextWidget,
    widgetConfig: { multiline: true },
  })
export const text = (cfg: Labeled<Opt>) =>
  valueField({
    label: cfg.label,
    schema: Domain.string(cfg),
    required: !cfg.optional,
    empty: '',
    widget: TextWidget,
    widgetConfig: { multiline: true },
  })

// --- number ---
// int/decimal have overloads on `optional`; the builders mirror them so a REQUIRED number
// field yields `number` in the payload (not `number | undefined`).
const intSchema = Domain.int as (o?: NumOpt) => Schema.Schema<number | undefined, string>
const decimalSchema = Domain.decimal as (o?: NumOpt) => Schema.Schema<number | undefined, string>

const numberField = (cfg: Labeled<NumOpt>, schema: Schema.Schema<number | undefined, string>) =>
  valueField({ label: cfg.label, schema, required: !cfg.optional, empty: '', widget: NumberWidget })

export function int(cfg: Labeled<NumOpt> & { readonly optional: true }): ValueField<string, number | undefined>
export function int(cfg: Labeled<NumOpt>): ValueField<string, number>
export function int(cfg: Labeled<NumOpt>): ValueField<string, any> {
  return numberField(cfg, intSchema(cfg))
}

export function decimal(cfg: Labeled<NumOpt> & { readonly optional: true }): ValueField<string, number | undefined>
export function decimal(cfg: Labeled<NumOpt>): ValueField<string, number>
export function decimal(cfg: Labeled<NumOpt>): ValueField<string, any> {
  return numberField(cfg, decimalSchema(cfg))
}

// --- date / time ---
export const date = (cfg: Labeled<Opt & { validate?: (v: string) => string | undefined }>) =>
  valueField({ label: cfg.label, schema: Domain.date(cfg), required: !cfg.optional, empty: '', widget: DateWidget })
export const time = (cfg: Labeled<Opt & { seconds?: boolean }>) =>
  valueField({
    label: cfg.label,
    schema: Domain.time(cfg),
    required: !cfg.optional,
    empty: '',
    widget: TimeWidget,
    widgetConfig: { seconds: cfg.seconds },
  })

// --- datetime (date + time; payload is a real Date, filled only when both are entered) ---
type DateTimeOpt = Opt & { validate?: (v: Date) => string | undefined }
const datetimeSchema = Domain.datetime as (o?: DateTimeOpt) => Schema.Schema<Date | undefined, string>

export function datetime(cfg: Labeled<DateTimeOpt> & { readonly optional: true }): ValueField<string, Date | undefined>
export function datetime(cfg: Labeled<DateTimeOpt>): ValueField<string, Date>
export function datetime(cfg: Labeled<DateTimeOpt>): ValueField<string, any> {
  return valueField<Date | undefined, string>({
    label: cfg.label,
    schema: datetimeSchema(cfg),
    required: !cfg.optional,
    empty: '',
    widget: DateTimeWidget,
  })
}

// --- flag ---
export const flag = (cfg: { label: string }): ValueField<boolean, boolean> =>
  valueField<boolean, boolean>({
    label: cfg.label,
    schema: Domain.flag(),
    required: false,
    empty: false,
    widget: BoolWidget,
  })

// --- enum (select) ---
export const enumField = (cfg: Labeled<Opt> & { options: ReadonlyArray<SelectOption> }) =>
  valueField({
    label: cfg.label,
    schema: Domain.enumOf(
      cfg.options.map(x => x.value),
      cfg,
    ),
    required: !cfg.optional,
    empty: '',
    widget: SelectWidget,
    widgetConfig: { options: cfg.options },
  })

// --- multi enum (multiselect over static options) ---
export const multiEnum = (cfg: Labeled<Opt> & { options: ReadonlyArray<SelectOption>; placeholder?: string }) =>
  valueField<readonly string[], readonly string[]>({
    label: cfg.label,
    schema: Domain.multiEnumOf(
      cfg.options.map(x => x.value),
      cfg,
    ),
    required: !cfg.optional,
    empty: [],
    widget: MultiSelectWidget,
    widgetConfig: { options: cfg.options, placeholder: cfg.placeholder },
  })

// --- combo (async select TEA unit; single or multi) ---
// Two separate, clearly-named concerns (shared by single & multi combos):
//   - dependsOn : the parent field(s) — one name or several. Changing a parent resets this
//                 field, disables it until every parent is set, and re-runs the search.
//   - criteria  : how those parent values become the search criteria for THIS combo, e.g.
//                 `deps => ({ grupaID: deps.grupa })` (criterion on the left, value on the right).
type DependsOn = string | ReadonlyArray<string>
type Criteria = (deps: Record<string, unknown>) => Record<string, unknown>

const parentsOf = (dependsOn?: DependsOn): ReadonlyArray<string> | undefined =>
  dependsOn === undefined ? undefined : typeof dependsOn === 'string' ? [dependsOn] : dependsOn

const comboConfig =
  (source: ComboSource, criteria: Criteria, multiple = false) =>
  (ctx: { deps: Record<string, unknown> }): Combo.Config<any> => ({
    search: (q, offset) => source.request(criteria(ctx.deps), q, offset),
    toOptions: source.toOptions,
    total: source.total,
    multiple,
  })

const noCriteria: Criteria = () => ({})

export type ComboConfig = {
  readonly label: string
  readonly placeholder?: string
  readonly optional?: boolean
  /** The search route + result->option mapping, declared in the feature's api. */
  readonly source: ComboSource
  /** Parent field(s) this combo depends on (reset + disable + re-search). */
  readonly dependsOn?: DependsOn
  /** How the parent values become this combo's search criteria, e.g. `d => ({ grupaID: d.grupa })`. */
  readonly criteria?: Criteria
  /** Send the selected id as a number (default). Set false for string ids (codes/GUIDs). */
  readonly numeric?: boolean
  /** Edit mode: resolve the label for a preselected id. */
  readonly resolve?: (id: string) => Http.Request<SelectOption>
}

// The payload type follows the same two switches the schema below does, so `Payload<F>`
// tells the truth about what a combo contributes to the request body.
type ComboId<C extends ComboConfig> = C extends { readonly numeric: false }
  ? string
  : C extends { readonly optional: true }
    ? number | undefined
    : number

export const combo = <const C extends ComboConfig>(cfg: C): FieldDef<string, Combo.Model, Combo.Msg, ComboId<C>> => {
  const parentFields = parentsOf(cfg.dependsOn)
  const config = comboConfig(cfg.source, cfg.criteria ?? noCriteria)
  // The draft is always the string id (the widget's value); the payload is a number by default.
  const schema =
    (cfg.numeric ?? true)
      ? cfg.optional
        ? Domain.optionalNumber({})
        : Domain.requiredNumber({})
      : cfg.optional
        ? Schema.String
        : Schema.String.pipe(Schema.minLength(1, { message: () => 'Obavezno polje' }))

  // The schema is picked at runtime from the same two switches ComboId encodes at the type
  // level; this cast is where those two meet.
  const field: FieldDef<string, Combo.Model, Combo.Msg, any> = {
    schema,
    empty: '',
    required: !cfg.optional,
    dependsOn: parentFields,
    init: v => {
      if (v === '') return [Combo.init, Cmd.none]
      const provisional = Combo.withSelected({ value: v, label: v }) // show id until resolved
      return cfg.resolve
        ? [
            provisional,
            Http.send(cfg.resolve(v), {
              onSuccess: option => Combo.Msg.Resolved({ option }),
              onError: () => Combo.Msg.Resolved({ option: { value: v, label: v } }),
            }),
          ]
        : [provisional, Cmd.none]
    },
    value: Combo.value,
    set: (_s, v) => (v === '' ? Combo.init : Combo.withSelected({ value: v, label: v })),
    update: (msg, state, ctx) => Combo.update(config(ctx), msg, state),
    changed: Combo.isSelectionChange,
    view: (state, ui) =>
      Combo.view(state, {
        label: cfg.label,
        placeholder: cfg.placeholder,
        required: ui.required,
        disabled: !ui.enabled || ui.readonly,
        errorMessage: topMessage(ui.issues),
      }),
  }
  return field
}

// --- multi combo (async multi-select TEA unit; value is string[]) ---
export type MultiComboConfig = {
  readonly label: string
  readonly placeholder?: string
  readonly optional?: boolean
  readonly source: ComboSource
  /** Parent field(s) this combo depends on (reset + disable + re-search). */
  readonly dependsOn?: DependsOn
  /** How the parent values become this combo's search criteria. */
  readonly criteria?: Criteria
  /** Send the selected ids as numbers (default). Set false for string ids (codes/GUIDs). */
  readonly numeric?: boolean
  /** Edit mode: resolve labels for preselected ids. */
  readonly resolve?: (ids: ReadonlyArray<string>) => Http.Request<ReadonlyArray<SelectOption>>
}

type ComboIds<C extends MultiComboConfig> = C extends { readonly numeric: false }
  ? ReadonlyArray<string>
  : ReadonlyArray<number>

export const multiCombo = <const C extends MultiComboConfig>(
  cfg: C,
): FieldDef<readonly string[], Combo.Model, Combo.Msg, ComboIds<C>> => {
  const parentFields = parentsOf(cfg.dependsOn)
  const config = comboConfig(cfg.source, cfg.criteria ?? noCriteria, true)
  const seed = (ids: readonly string[]) => Combo.withSelectedMany(ids.map(id => ({ value: id, label: id })))
  // Draft is the string ids; the payload is number[] by default (String[] when numeric: false).
  const element = (cfg.numeric ?? true) ? Schema.NumberFromString : Schema.String
  const schema = cfg.optional
    ? Schema.Array(element)
    : Schema.Array(element).pipe(Schema.minItems(1, { message: () => 'Izaberite bar jednu vrednost' }))

  const field: FieldDef<readonly string[], Combo.Model, Combo.Msg, any> = {
    schema,
    empty: [],
    required: !cfg.optional,
    dependsOn: parentFields,
    init: v => {
      if (v.length === 0) return [Combo.init, Cmd.none]
      const provisional = seed(v) // show ids until resolved
      return cfg.resolve
        ? [
            provisional,
            Http.send(cfg.resolve(v), {
              onSuccess: options => Combo.Msg.ResolvedMany({ options }),
              onError: () => Combo.Msg.ResolvedMany({ options: provisional.selected }),
            }),
          ]
        : [provisional, Cmd.none]
    },
    value: Combo.values,
    set: (_s, v) => (v.length === 0 ? Combo.init : seed(v)),
    update: (msg, state, ctx) => Combo.update(config(ctx), msg, state),
    changed: Combo.isSelectionChange,
    view: (state, ui) =>
      Combo.view(state, {
        label: cfg.label,
        placeholder: cfg.placeholder,
        required: ui.required,
        disabled: !ui.enabled || ui.readonly,
        errorMessage: topMessage(ui.issues),
        multiple: true,
      }),
  }
  return field
}
