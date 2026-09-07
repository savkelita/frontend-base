# frontend-base

Base project for admin/dashboard applications using the
[tea-effect](https://github.com/savkelita/tea-effect) architecture.

## Tech Stack

- **Architecture**: tea-effect (The Elm Architecture + Effect-TS)
- **UI**: React 18 + FluentUI 9
- **Language**: TypeScript 5.7
- **Build**: Webpack 5 + Babel
- **Linting**: ESLint 9 (flat config) + Prettier 3
- **Testing**: Vitest + @effect/vitest
- **Git Hooks**: Husky + lint-staged + commitlint

## Getting Started

```sh
yarn install
yarn start
```

Open https://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Dev server at https://localhost:3000 |
| `yarn build` | Production build to dist/ |
| `yarn checkts` | TypeScript type checking |
| `yarn lint` | ESLint check |
| `yarn test:unit` | Run unit tests (Vitest) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test` | Full verification: prettier + checkts + unit tests |
| `yarn fix-lint` | Auto-fix ESLint issues |
| `yarn fix-prettier` | Auto-fix formatting |

## Backend Proxy

Dev server proxies `/api/*` requests to the backend. Configure with environment variables:

```sh
# Default: https://localhost:8080
APIHOST=192.168.1.10 APIPORT=9090 yarn start
```

The proxy strips the `/api` prefix by default - `/api/users` becomes `/users` on the backend.
If your backend routes include `/api`, remove the `pathRewrite` in `webpack/webpack.dev.js`.

## Project Structure

```
src/
├── index.tsx                # Entry point (FluentProvider + tea-effect)
├── common/
│   ├── theme/index.ts       # CSS reset / global styles
│   ├── env/index.ts         # Type-safe environment variables
│   ├── forms/               # Schema-driven forms library (see "Adding a Form")
│   ├── pretraga/            # Shared backend search contract (combo sources)
│   └── domain/              # Reusable field schemas (text, number, boolean, choice, datetime)
├── home/                    # Home page (placeholder)
│   ├── model.ts
│   ├── msg.ts
│   └── index.tsx
├── navigation/              # Side drawer navigation
│   ├── types.ts             # NavigationEntry tagged enum
│   ├── config.ts            # Nav items declaration
│   ├── model.ts
│   ├── msg.ts
│   └── index.tsx
└── router/                  # Top-level orchestrator
    ├── route.ts             # Route definitions
    ├── screen-model.ts      # Screen tagged enum (all page models)
    ├── screen-msg.ts        # Screen messages (all page messages)
    ├── selected-nav.ts      # Screen -> nav highlighting
    ├── model.ts
    ├── msg.ts
    ├── components/
    │   ├── layout.tsx       # App shell (header, drawer, content)
    │   └── not-found-view.tsx
    └── index.tsx            # init, update, view, subscriptions
```

## TEA Module Pattern

Every feature module follows this structure:

| File | Purpose |
|------|---------|
| `model.ts` | Readonly state types (record or tagged union) |
| `msg.ts` | Message types and constructors using `Data.taggedEnum` |
| `index.tsx` | Exports: `init`, `update`, `view` (optionally `subscriptions`) |

```
Model -> View -> Msg -> Update -> Model
```

- `init` returns `[Model, Cmd.Cmd<Msg>]`
- `update(msg, model)` returns `[Model, Cmd.Cmd<Msg>]`
- `view(model)` returns `Html<Msg>`
- Side effects are described as `Cmd`, never performed directly

## Adding a New Page

1. Create `src/<feature>/model.ts`, `msg.ts`, `index.tsx`
2. Add route in `src/router/route.ts`
3. Add screen variant in `src/router/screen-model.ts` and `screen-msg.ts`
4. Wire into `startScreen`, `updateScreen`, `screenView` in `src/router/index.tsx`
5. Add navigation entry in `src/navigation/config.ts`
6. Update `src/router/selected-nav.ts` for nav highlighting

## Adding a Form

Forms use **`@tea-effect/forms`** (`src/common/forms`): a form is a state machine built from
field units. State is minimal (values + touched + status); everything a widget needs (`FieldUi`:
enabled/readonly/dirty/required/issues/validating) is **derived**.

The library is organised as:

```
common/forms/
  index.ts      public API (the `Form` object)
  builders.tsx  field builders (Form.code10 / enumField / combo / datetime / …)
  page.tsx      Form.page (the standard view shell)
  core/         the engine — field, object, combine, async, types
  widgets/      presentational FluentUI widgets (+ WidgetProps, SelectOption)
  combo/        the async-select TEA unit (single + multi)
```

Field schemas live in `src/common/domain` (pure `effect/Schema`).

### 1. Describe the form (`form.ts`)

`Form.object` composes field builders. Every builder takes a single config object with a
`label` (+ type-specific options). `layout` (also in `form.ts`, a `.tsx`) is a render prop:
you get a `field(key)` renderer and place each field yourself — full control over width,
position, grid, spans.

```tsx
import { Form } from '../../common/forms'
import type { FormModel, FormMsg, FieldRenderer } from '../../common/forms'
import * as Api from '../api'

export const fields = {
  code: Form.code10({ label: 'Šifra', validate: v => (/^[A-Za-z]/.test(v) ? undefined : 'Mora počinjati slovom') }),
  note: Form.desc({ label: 'Opis', optional: true }),
  price: Form.decimal({ label: 'Cena', min: 0 }),
  category: Form.enumField({ label: 'Kategorija', options: CATEGORY_OPTIONS }),
  grupa: Form.combo({ label: 'Grupa', optional: true, source: Api.grupaCombo }),
  // dependsOn = which parent; criteria = how it is sent to podgrupa's search
  podgrupa: Form.combo({
    label: 'Podgrupa',
    optional: true,
    source: Api.podgrupaCombo,
    dependsOn: 'grupa',
    criteria: deps => ({ grupaID: deps.grupa }),
  }),
}

export const ProductForm = Form.object(fields)
export type ProductFormModel = FormModel<typeof fields>
export type ProductFormMsg = FormMsg<typeof fields>

// place each field however you like — widths, columns, spans
export const layout = (field: FieldRenderer<typeof fields>) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
    <div style={{ gridColumn: '1 / -1' }}>{field('code')}</div>
    <div>{field('price')}</div>
    <div>{field('category')}</div>
    <div style={{ gridColumn: '1 / -1' }}>{field('note')}</div>
  </div>
)
```

### 2. Wire the feature (`model.ts` / `msg.ts` / `index.tsx`)

The form owns field interaction; the **feature owns the save** (`trySubmit` → `Http.send`).
The **view is a single `Form.page`** call — a standard shell (title, error bar, submit/cancel)
around your `layout`:

```ts
// Model: { form: ProductFormModel; error; saved }
// Msg:   Form { msg } | Submit | Saved { product } | Failed { error }

// update
Form:   ({ msg }) => { const [form, cmd] = ProductForm.update(msg, model.form); return [{ ...model, form }, Cmd.map(formMsg)(cmd)] },
Submit: () => {
  const [form, payload] = ProductForm.trySubmit(model.form)
  return Option.match(payload, {
    onNone: () => [{ ...model, form }, Cmd.none],
    onSome: p => [{ ...model, form }, Http.send(Api.createProduct(p), { onSuccess: saved, onError: failed })],
  })
},
Saved: ({ product }) => [{ ...model, form: ProductForm.toEditing(model.form) }, Navigation.pushUrl('/products')],

// view
export const view = model => dispatch =>
  Form.page({
    spec: ProductForm, model: model.form, layout, title: 'New product',
    error: Option.isSome(model.error) ? 'Snimanje nije uspelo.' : undefined,
    dispatch: m => dispatch(formMsg(m)),
    onSubmit: () => dispatch(submit()),
    cancel: { label: 'Odustani', href: '/products' },
  })
```

`FormSpec` gives `create/edit/copy/view`, `update`, `trySubmit`, `render`, `fieldUi`,
`isDirty/isValid/validate`, `toEditing`, `withServerIssues`.

### Field builders

Every builder takes `{ label, ... }`:

| Backend type | Builder | Payload |
|---|---|---|
| code10 / code30 / name / desc / string | `Form.code10/code30/name/desc/text({ label, optional?, validate? })` | `string` |
| int / decimal | `Form.int/decimal({ label, min?, max?, optional?, validate? })` | `number` |
| date / time | `Form.date/time({ label, optional?, validate?, seconds? })` | `string` |
| datetime | `Form.datetime({ label, optional?, validate? })` | `Date` |
| flag | `Form.flag({ label })` | `boolean` |
| enum | `Form.enumField({ label, options, optional? })` | `string` |
| enum multi | `Form.multiEnum({ label, options, optional?, placeholder? })` | `string[]` |
| combo | `Form.combo({ label, source, optional?, dependsOn?, numeric?, resolve? })` | `number` |
| combo multi | `Form.multiCombo({ label, source, optional?, dependsOn?, numeric?, resolve? })` | `number[]` |

Values are encoded (string / boolean / string[]); `trySubmit` decodes to the typed payload.
Date shows dd.mm.yyyy but stores `YYYY-MM-DD`; time is 24h `HH:mm` (`{ seconds: true }` → `HH:mm:ss`).
**datetime** is a DatePicker + masked time input (dd.mm.yyyy + HH:mm); it has a value only when
**both** are entered, and decodes to a real `Date`. Time inputs are masked (type digits → `HH:mm`,
no dropdown); date/time fields have a fixed width. **multiEnum** yields a `string[]` (codes).
**combo / multiCombo** send the selected **id(s) as numbers** by default (the widget still works
in string ids); pass `numeric: false` for string ids (codes/GUIDs).

### Combo (async select)

`Form.combo` (single) and `Form.multiCombo` (multi) are async selects. Under the hood both are
the same TEA unit (`src/common/forms/combo`): fetch is a `Cmd`, state lives in the model, and a
`seq` guard drops out-of-order responses — all testable through `update`. The form only names a
**`source`**, declared in the feature's `api/combo-definitions.ts` via `pretragaCombo`
(which adds the `unetaVrednost` type-ahead criterion automatically):

```ts
// products/api/combo-definitions.ts — results follow `{ id, sifra?, naziv }`, so the label
// is derived automatically: `sifra - naziv`, or just `naziv` when there is no sifra.
export const grupaCombo = pretragaCombo(pretraziGrupaCombo)
// pass a mapper only for a non-standard label:
//   pretragaCombo(pretraziKorisnikCombo, k => ({ value: String(k.id), label: `${k.ime} ${k.prezime}` }))

// form
Form.combo({ label: 'Grupa', source: Api.grupaCombo })
```

The **route + criteria/result types live in the feature's `api`**, on the shared pretraga
contract (`src/common/pretraga`: `PretragaRequest`/`PretragaResponse`, `BaseComboCriteria`,
`contains`, `response`, and `comboRequest` — the route builder that adds `limit_`/`offset_`
and decodes the response; combos default to `limit_ = 10`, `offset_ = 0`). See `src/products/api`.

**Paging ("load more").** A combo loads the first page (`offset_ = 0`); while more rows match
than are loaded (`total_ > options.length`), it shows a **"Učitaj još (N od M)"** row. Selecting
it fetches the next page at `offset_ = <rows loaded>` (10, 20, …) and **appends** it, keeping the
list open. `seq` still drops stale responses; a new query restarts from the first page. The
popup is controlled (`Model.open`) so load-more doesn't close it.

### Cascading, sections, async validation, edit mode

- **Cascade** — two clearly-named props on a child combo: `dependsOn` names the parent
  field(s) (one name or an array — resets + disables until every parent is set + re-searches),
  and `criteria` says how those values become the search criteria, e.g.
  `criteria: deps => ({ grupaID: deps.grupa })` (criterion on the left, value on the right).
  Depending on 2+ fields is just `dependsOn: ['grupa', 'magacin']`.
- **Sections** — `Form.combine({ general, lot }, { rebind })` merges field-group maps over
  dotted paths (`general.warehouse`). Cross-section links use `rebind`
  (`{ field: 'lot.lot', dep: 'warehouse', to: 'general.warehouse' }`); dangling deps throw at
  build time. Reset / deps / auto-disable work across sections.
- **Async validation** — `Form.asyncValidated(field, { check, toIssues, debounceMs })` wraps
  any field with debounced server validation (e.g. uniqueness). Results surface as the
  field's issues; `FieldUi.validating` flags in-flight checks.
- **Edit mode** — pass `resolve: id => Http.Request<SelectOption>` to a combo so a preselected
  id shows its label (hydration, no cascade); init the form with `spec.edit(record)`.

### Create / update / delete

The same shape as Magacin (`kreiranje` / `azuriranje` / `brisanje`), separate feature modules:

- **Update** (`src/products/edit`) — `init(id)` loads via a *daj-info* route (`getProduct`),
  then `spec.edit(toDraft(record))`; the feature owns the load-state (`Loading | Ready | Failed`)
  and renders as a **dialog** (`Form.dialog`) hosted by the list. Its `update` returns an
  `Outcome` (`Active | Saved | Cancelled`) the list folds (`Saved` → close + refetch).
  The **create and update forms need not match** — the edit form is a smaller `Form.object`,
  renders `category` read-only (create-only), and omits create-only fields.
- **Payload → body** — `trySubmit` gives the validated `Payload<F>`, but the feature maps it to
  the request body (`toCreateBody` / `toUpdateBody`): drop form-only fields, rename, and inject
  attributes not on the form (e.g. `id` + `version` for optimistic concurrency). The form never
  sends itself directly.
- **Delete** (`src/products/delete`) — always a confirmation via `Form.confirmDialog`. Its
  `update` returns an `Outcome` (`Active | Deleted | Cancelled`); the host (the list) folds it:
  `Deleted` → close + refetch, `Cancelled` → close.

### Two chromes: `Form.page` and `Form.dialog`

The same form body (`layout` render-prop + error bar + actions) renders either as a full screen
(`Form.page`) or as a modal (`Form.dialog`). `Form.dialog` also owns a `Loading | Ready | Failed`
state so an edit dialog shows a spinner while its record loads.

### Adding a project-specific field type

Add a schema in `common/domain` and a builder in `common/forms` (wrap a widget). Validation
messages live on the schema, so wording is consistent and translatable in one place. Full
working example: `src/products/create` (create), `src/products/edit` (update), `src/products/delete`.

## Git Conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint):

```
feat: add user list page
fix: resolve navigation drawer toggle
refactor: extract shared layout component
test: add update tests for home module
chore: update dependencies
```

Pre-commit hook runs lint-staged (ESLint + Prettier) and TypeScript check to prevent bad commits.

## Environment Variables

Defined in `src/common/env/index.ts` and injected via Webpack `DefinePlugin`.

To add a new variable:
1. Update the `Env` type in `src/common/env/index.ts`
2. Add the value in both `webpack/webpack.dev.js` and `webpack/webpack.prod.js`

## License

MIT
