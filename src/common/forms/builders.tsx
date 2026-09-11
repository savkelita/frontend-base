import { Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type { ReactElement } from 'react'
import * as Domain from '../domain'
import { t } from '../strings'
import type { ComboSource, ComboValue } from './core/types'
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

/** Obično (ne-async) polje: State = Value, Msg = nova Value. */
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
    // Računa se samo prava izmena: ponovno kucanje istog teksta ne sme da resetuje zavisna
    // polja niti da ponovo pokrene efekte forme.
    changed: (msg, previous) => !sameValue(msg, previous),
    view: (state, ui) => dispatch => (
      <W
        label={t(cfg.label)}
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
// int/decimal imaju overload-e na `optional`; builderi ih preslikavaju da OBAVEZNO brojno
// polje da `number` u payload-u (a ne `number | undefined`).
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

/**
 * Из вредности родитеља у критеријуме комбоа. `deps` носи нацрте родитељских поља, па им
 * тип није познат — зато `roditelj` испод, уместо каста на месту позива.
 */
type Criteria<C> = (deps: Record<string, unknown>) => C

/**
 * Вредност родитеља из каскаде. Нацрт комбоа увек носи текст; празан родитељ даје
 * `undefined`, да критеријум испадне уместо да оде као празан низ.
 */
export const roditelj = (deps: Record<string, unknown>, polje: string): string | number | undefined => {
  const vrednost = deps[polje]
  if (typeof vrednost === 'string') return vrednost === '' ? undefined : vrednost
  if (typeof vrednost === 'object' && vrednost !== null && 'id' in vrednost) {
    return (vrednost as ComboValue<unknown>).id
  }
  return undefined
}

const parentsOf = (dependsOn?: DependsOn): ReadonlyArray<string> | undefined =>
  dependsOn === undefined ? undefined : typeof dependsOn === 'string' ? [dependsOn] : dependsOn

const comboConfig =
  (source: ComboSource<any, any>, criteria: Criteria<any>, multiple = false) =>
  (ctx: { deps: Record<string, unknown> }): Combo.Config<any> => ({
    search: (q, offset) => source.request(criteria(ctx.deps), q, offset),
    toOptions: source.toOptions,
    total: source.total,
    multiple,
  })

// Combo без каскаде не шаље ниједан свој критеријум; шема их све има необавезне.
const noCriteria: Criteria<any> = () => ({})

export type ComboConfig<Result = unknown, Crit = Record<string, unknown>> = {
  readonly label: string
  readonly placeholder?: string
  readonly optional?: boolean
  /** The search route + result->option mapping, declared in the feature's api. */
  readonly source: ComboSource<Result, Crit>
  /** Parent field(s) this combo depends on (reset + disable + re-search). */
  readonly dependsOn?: DependsOn
  /** How the parent values become this combo's search criteria, e.g. `d => ({ grupaID: roditelj(d, 'grupa') })`. */
  readonly criteria?: Criteria<Crit>
  /** Send the selected id as a number (default). Set false for string ids (codes/GUIDs). */
  readonly numeric?: boolean
}

// Tip payload-a prati iste dve grane koje prati i šema ispod, pa `Payload<F>` govori istinu
// o tome šta combo doprinosi telu zahteva.
type ComboId<C extends ComboConfig<any>> = C extends { readonly numeric: false }
  ? string
  : C extends { readonly optional: true }
    ? number | undefined
    : number

/** Tip reda koji izvor pretražuje, prenet na svaku opciju ovog polja. */
type ComboRow<C> = C extends { readonly source: ComboSource<infer R, any> } ? R : unknown

/** Критеријуми које извор признаје — из њих се проверава `criteria` функција поља. */
type ComboCrit<C> = C extends { readonly source: ComboSource<any, infer K> } ? K : Record<string, unknown>

/**
 * Непознат кључ у критеријумима: `samoPoznata` би га у извршавању тихо избацио, па combo
 * враћа непросејане редове а нико не зна зашто. Овде постаје грешка при превођењу.
 */
type NepoznatKriterijum<C> = C extends { readonly criteria: (...args: never) => infer R }
  ? Exclude<keyof R, keyof ComboCrit<C>>
  : never

type ProveriKriterijume<C> = [NepoznatKriterijum<C>] extends [never]
  ? unknown
  : { readonly criteria: `непознат критеријум: ${NepoznatKriterijum<C> & string}` }

// -------------------------------------------------------------------------------------
// Нацрт combo поља је изабрана вредност, не голи идентификатор
// -------------------------------------------------------------------------------------
//
// Тако `initialForm` уме да напуни поље из `Info` одговора — заједно са лабелом, јер
// `Info` не носи иста поља као ред претраге — а `derive` чита цео ред кроз `row`.
//
// Унутра је `SelectOption` (оно што combo јединица већ разуме), па су ово само два
// пресликавања.

const uOpciju = (v: ComboValue<any>): SelectOption<any> => ({ value: String(v.id), label: v.label, data: v.row })

const izOpcije = (o: SelectOption<any>): ComboValue<any> => ({ id: o.value, label: o.label, row: o.data })

/**
 * Од изабране вредности до онога што иде у тело захтева. Идентификатор се прво сведе на
 * текст, па се пусти кроз постојеће домен провере — оне већ дају и поруку „Obavezno polje".
 */
const comboSchema = (base: Schema.Schema<any, string>) =>
  Schema.compose(
    Schema.transform(Schema.Any, Schema.String, {
      strict: false,
      decode: (v: ComboValue<any> | undefined) => (v === undefined ? '' : String(v.id)),
      encode: (s: string) => (s === '' ? undefined : { id: s, label: s }),
    }),
    base,
  ) as unknown as Schema.Schema<any, any>

const comboMultiSchema = (base: Schema.Schema<any, readonly string[]>) =>
  Schema.compose(
    Schema.transform(Schema.Any, Schema.Array(Schema.String), {
      strict: false,
      decode: (v: ReadonlyArray<ComboValue<any>>) => v.map(x => String(x.id)),
      encode: (ids: ReadonlyArray<string>) => ids.map(id => ({ id, label: id })),
    }),
    base,
  ) as unknown as Schema.Schema<any, any>

export const combo = <const C extends ComboConfig<any, any>>(
  cfg: C & { readonly criteria?: Criteria<ComboCrit<C>> } & ProveriKriterijume<C>,
): FieldDef<ComboValue<ComboRow<C>> | undefined, Combo.Model, Combo.Msg, ComboId<C>> => {
  const parentFields = parentsOf(cfg.dependsOn)
  const config = comboConfig(cfg.source, cfg.criteria ?? noCriteria)
  const schema = comboSchema(
    (cfg.numeric ?? true)
      ? cfg.optional
        ? Domain.optionalNumber({})
        : Domain.requiredNumber({})
      : cfg.optional
        ? Schema.String
        : Schema.String.pipe(Schema.minLength(1, { message: () => 'Obavezno polje' })),
  )

  const seed = (v: ComboValue<any> | undefined) => (v === undefined ? Combo.init : Combo.withSelected(uOpciju(v)))

  const field: FieldDef<ComboValue<any> | undefined, Combo.Model, Combo.Msg, any> = {
    schema,
    empty: undefined,
    required: !cfg.optional,
    dependsOn: parentFields,
    init: v => [seed(v), Cmd.none],
    value: state => (state.selected[0] === undefined ? undefined : izOpcije(state.selected[0])),
    set: (_s, v) => seed(v),
    update: (msg, state, ctx) => Combo.update(config(ctx), msg, state),
    changed: Combo.isSelectionChange,
    view: (state, ui) =>
      Combo.view(state, {
        label: t(cfg.label),
        placeholder: cfg.placeholder,
        required: ui.required,
        disabled: !ui.enabled || ui.readonly,
        errorMessage: topMessage(ui.issues),
      }),
  }
  return field
}

// --- multi combo (async multi-select TEA unit; value is string[]) ---
export type MultiComboConfig<Result = unknown, Crit = Record<string, unknown>> = {
  readonly label: string
  readonly placeholder?: string
  readonly optional?: boolean
  readonly source: ComboSource<Result, Crit>
  /** Parent field(s) this combo depends on (reset + disable + re-search). */
  readonly dependsOn?: DependsOn
  /** How the parent values become this combo's search criteria. */
  readonly criteria?: Criteria<Crit>
  /** Send the selected ids as numbers (default). Set false for string ids (codes/GUIDs). */
  readonly numeric?: boolean
}

type ComboIds<C extends MultiComboConfig<any>> = C extends { readonly numeric: false }
  ? ReadonlyArray<string>
  : ReadonlyArray<number>

export const multiCombo = <const C extends MultiComboConfig<any, any>>(
  cfg: C & { readonly criteria?: Criteria<ComboCrit<C>> } & ProveriKriterijume<C>,
): FieldDef<ReadonlyArray<ComboValue<ComboRow<C>>>, Combo.Model, Combo.Msg, ComboIds<C>> => {
  const parentFields = parentsOf(cfg.dependsOn)
  const config = comboConfig(cfg.source, cfg.criteria ?? noCriteria, true)
  const element = (cfg.numeric ?? true) ? Schema.NumberFromString : Schema.String
  const schema = comboMultiSchema(
    cfg.optional
      ? Schema.Array(element)
      : Schema.Array(element).pipe(Schema.minItems(1, { message: () => 'Izaberite bar jednu vrednost' })),
  )

  const seed = (v: ReadonlyArray<ComboValue<any>>) =>
    v.length === 0 ? Combo.init : Combo.withSelectedMany(v.map(uOpciju))

  const field: FieldDef<ReadonlyArray<ComboValue<any>>, Combo.Model, Combo.Msg, any> = {
    schema,
    empty: [],
    required: !cfg.optional,
    dependsOn: parentFields,
    init: v => [seed(v), Cmd.none],
    value: state => state.selected.map(izOpcije),
    set: (_s, v) => seed(v),
    update: (msg, state, ctx) => Combo.update(config(ctx), msg, state),
    changed: Combo.isSelectionChange,
    view: (state, ui) =>
      Combo.view(state, {
        label: t(cfg.label),
        placeholder: cfg.placeholder,
        required: ui.required,
        disabled: !ui.enabled || ui.readonly,
        errorMessage: topMessage(ui.issues),
        multiple: true,
      }),
  }
  return field
}
