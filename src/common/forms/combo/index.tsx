import { Field, Combobox, Option as ComboOption } from '@fluentui/react-components'
import { Duration, Effect } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { ChangeEvent } from 'react'
import type { SelectOption } from '../widgets/select'
import { Msg } from './msg'
import * as Model from './model'

export * from './model'
export { Msg, isSelectionChange } from './msg'
export type { Model } from './model'

// -------------------------------------------------------------------------------------
// Combo — a reusable async select TEA unit (single or multi)
// -------------------------------------------------------------------------------------
//
// The feature owns a `Model` per combo and wires its `Msg` through its own update. Async
// is a `Cmd` (Http.send), never an effect in the view. Parameterised by a `Config`: how
// to search (returns the domain request) and how to map the response to options — so it
// stays decoupled from any particular backend contract.

export type Config<A> = {
  readonly search: (query: string, offset: number) => Http.Request<A>
  readonly toOptions: (response: A) => ReadonlyArray<SelectOption>
  /** Total matching rows (defaults to the number of options when not provided). */
  readonly total?: (response: A) => number
  /** Višestruki izbor: može se izabrati više vrednosti (bez usklađivanja unosa pri zatvaranju). */
  readonly multiple?: boolean
  /** Koliko se čeka posle poslednjeg pritiska tastera pre pretrage (podrazumevano 300ms). */
  readonly debounceMs?: number
}

// Dovuci jednu stranu. `seq` obeležava zahtev da bi odgovor koji stigne posle novijeg zahteva
// mogao da se odbaci; `offset` putuje do Loaded da reducer zna da li da zameni listu
// (offset 0, nov upit) ili da je nadoveže (offset > 0, učitaj još).
const fetchPage = <A,>(config: Config<A>, seq: number, query: string, offset: number): Cmd.Cmd<Msg> =>
  Http.send(config.search(query, offset), {
    onSuccess: (response): Msg => {
      const options = config.toOptions(response)
      return Msg.Loaded({ seq, options, total: config.total?.(response) ?? options.length, offset })
    },
    onError: (): Msg => Msg.Failed({ seq }),
  })

// Pretraži odmah (otvaranje liste, učitavanje sledeće strane).
const load = <A,>(
  config: Config<A>,
  model: Model.Model,
  query: string,
  offset: number,
): [Model.Model, Cmd.Cmd<Msg>] => {
  const seq = model.seq + 1
  return [{ ...model, loading: true, loadingMore: false, failed: false, seq }, fetchPage(config, seq, query, offset)]
}

export const update = <A,>(config: Config<A>, msg: Msg, model: Model.Model): [Model.Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    // Load once on first open; re-open keeps the already-loaded pages.
    Opened: (): [Model.Model, Cmd.Cmd<Msg>] => {
      const opened = { ...model, open: true }
      return opened.options.length > 0 || opened.loading ? [opened, Cmd.none] : load(config, opened, opened.query, 0)
    },
    // Ignoriši zahtev za zatvaranje dok je "učitaj još" u letu, jer FluentUI taj red tretira
    // kao izbor opcije i zatvorio bi listu ispod strane koja se dovlači.
    // Inače uskladi: polje sa jednim izborom prikazuje `query`, pa bi otkucan tekst bez izbora
    // ostao pored vrednosti koju ne opisuje. Zatvaranje vraća labelu izabrane opcije (ili
    // briše tekst kad ništa nije izabrano).
    Closed: (): [Model.Model, Cmd.Cmd<Msg>] =>
      model.loadingMore
        ? [model, Cmd.none]
        : [{ ...model, open: false, query: config.multiple ? model.query : Model.label(model) }, Cmd.none],
    // Nov upit uvek kreće od prve strane. Sam zahtev je odložen: seq se rezerviše odmah (pa se
    // odgovori u letu istog trena odbacuju), a pretraga kreće samo ako u međuvremenu ne stigne
    // noviji pritisak tastera.
    QueryChanged: ({ query }): [Model.Model, Cmd.Cmd<Msg>] => {
      const seq = model.seq + 1
      // Podizanje seq-a poništava svako dovlačenje strane u toku, pa ono više ne drži listu otvorenom.
      return [
        { ...model, query, open: true, loading: true, loadingMore: false, failed: false, seq },
        Cmd.fromEffect(
          Effect.sleep(Duration.millis(config.debounceMs ?? 300)).pipe(Effect.as(Msg.Search({ seq, query }))),
        ),
      ]
    },
    // Odložena pretraga se pali samo za pritisak tastera koji je i dalje poslednji.
    Search: ({ seq, query }): [Model.Model, Cmd.Cmd<Msg>] =>
      seq === model.seq ? [model, fetchPage(config, seq, query, 0)] : [model, Cmd.none],
    // Fetch the next page: offset = rows loaded so far. Guarded so a double-click can't skip a page.
    LoadMore: (): [Model.Model, Cmd.Cmd<Msg>] => {
      if (model.loading) return [model, Cmd.none]
      const [next, cmd] = load(config, model, model.query, model.options.length)
      return [{ ...next, loadingMore: true }, cmd]
    },
    // Drop stale responses (a newer request has since been issued). offset 0 replaces; > 0 appends.
    Loaded: ({ seq, options, total, offset }): [Model.Model, Cmd.Cmd<Msg>] =>
      seq === model.seq
        ? [
            {
              ...model,
              options: offset > 0 ? [...model.options, ...options] : options,
              total,
              loading: false,
              loadingMore: false,
              failed: false,
              open: true,
            },
            Cmd.none,
          ]
        : [model, Cmd.none],
    // Keep already-loaded pages on failure (a failed "load more" shouldn't wipe the list).
    Failed: ({ seq }): [Model.Model, Cmd.Cmd<Msg>] =>
      seq === model.seq
        ? [{ ...model, loading: false, loadingMore: false, failed: true }, Cmd.none]
        : [model, Cmd.none],
    // Single-select: replace selection, show its label, close.
    Picked: ({ option }): [Model.Model, Cmd.Cmd<Msg>] => [
      { ...model, selected: [option], query: option.label, open: false },
      Cmd.none,
    ],
    Cleared: (): [Model.Model, Cmd.Cmd<Msg>] => [{ ...model, selected: [], query: '', open: false }, Cmd.none],
    // Multi-select: add/remove one option, keep the list open.
    Toggled: ({ option }): [Model.Model, Cmd.Cmd<Msg>] => [
      {
        ...model,
        selected: Model.isSelected(model, option.value)
          ? model.selected.filter(o => o.value !== option.value)
          : [...model.selected, option],
        open: true,
      },
      Cmd.none,
    ],
    // Hydration (no cascade); see isSelectionChange.
    Resolved: ({ option }): [Model.Model, Cmd.Cmd<Msg>] => [
      { ...model, selected: [option], query: option.label },
      Cmd.none,
    ],
    ResolvedMany: ({ options }): [Model.Model, Cmd.Cmd<Msg>] => [{ ...model, selected: options }, Cmd.none],
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

export type ViewOptions = {
  readonly label: string
  readonly required: boolean
  readonly disabled?: boolean
  readonly placeholder?: string
  readonly errorMessage?: string
  /** Multi-select: allow several values (checkmarks, list stays open on pick). */
  readonly multiple?: boolean
}

export const view =
  (model: Model.Model, options: ViewOptions): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => {
    const multiple = options.multiple ?? false
    // Multi shows the chosen labels in the input; single shows the (typeable) query.
    const inputValue = multiple ? model.selected.map(o => o.label).join(', ') : model.query
    return (
      <Field
        label={options.label}
        required={options.required}
        validationState={options.errorMessage ? 'error' : 'none'}
        validationMessage={options.errorMessage}
      >
        <Combobox
          clearable={!multiple}
          multiselect={multiple}
          open={model.open}
          disabled={options.disabled}
          placeholder={options.placeholder}
          value={inputValue}
          selectedOptions={multiple ? [...Model.values(model)] : Model.hasSelection(model) ? [Model.value(model)] : []}
          onOpenChange={(_e, data) => dispatch(data.open ? Msg.Opened() : Msg.Closed())}
          onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(Msg.QueryChanged({ query: e.target.value }))}
          onOptionSelect={(_e, data) => {
            // The "load more" row is an option we intercept: fetch the next page, keep the list open.
            if (data.optionValue === '__more') {
              dispatch(Msg.LoadMore())
              return
            }
            const hit = model.options.find(o => o.value === data.optionValue)
            if (multiple) {
              if (hit) dispatch(Msg.Toggled({ option: hit }))
              return
            }
            dispatch(hit ? Msg.Picked({ option: hit }) : Msg.Cleared())
          }}
        >
          {model.loading && (
            <ComboOption key="__loading" value="__loading" text="Učitavanje…" disabled>
              Učitavanje…
            </ComboOption>
          )}
          {model.failed && (
            <ComboOption key="__failed" value="__failed" text="Greška pri učitavanju" disabled>
              Greška pri učitavanju
            </ComboOption>
          )}
          {!model.loading && !model.failed && model.options.length === 0 && (
            <ComboOption key="__empty" value="__empty" text="Nema rezultata" disabled>
              Nema rezultata
            </ComboOption>
          )}
          {!model.loading &&
            model.options.map(option => (
              <ComboOption key={option.value} value={option.value} text={option.label}>
                {option.label}
              </ComboOption>
            ))}
          {!model.loading && !model.failed && model.total > model.options.length && (
            <ComboOption key="__more" value="__more" text="Učitaj još">
              Učitaj još ({model.options.length} od {model.total})
            </ComboOption>
          )}
        </Combobox>
      </Field>
    )
  }
