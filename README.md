# frontend-base

Base project for admin/dashboard applications using the
[tea-effect](https://github.com/savkelita/tea-effect) architecture.

> **Developer documentation lives in [docs/](docs/README.md)** (Serbian). It is the source of truth
> for how work is done in this project: module layout, naming, API conventions, forms, search
> screens, routes, authorization, testing, and step-by-step recipes. Read it before writing code.

## Tech Stack

- **Architecture**: tea-effect (The Elm Architecture + Effect-TS)
- **Forms**: [effect-form](https://www.npmjs.com/package/effect-form) — the schema carries the widget
- **UI**: React 18 + Fluent UI 9
- **Language**: TypeScript 5.9
- **Build**: Webpack 5 + Babel
- **Linting**: ESLint 9 (flat config) + Prettier 3
- **Testing**: Vitest + @effect/vitest (property tests via `effect`'s `FastCheck`)
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

The dev server proxies `/api/*` to the backend, forwarding the `/api` prefix as-is because backend
routes already include it. Defaults to `192.168.36.234:8080`:

```sh
APIHOST=192.168.1.10 APIPORT=9090 yarn start
```

`apiBaseUrl` is deliberately empty so requests go to the dev server origin and through the proxy —
the session is a cookie and must stay same-origin.

## Project Structure

```
src/
├── index.tsx               Entry point (FluentProvider + tea-effect)
├── router/                 Top-level orchestrator: routes, screens, session, layout
├── navigation/             Side drawer navigation
├── login/                  Two-step sign-in (identify, then pick role)
├── home/                   Home page
├── auth/                   Session, funkcionalnosti, roles
├── common/                 Shared building blocks
│   ├── audit/              Audit schema + table cell
│   ├── domain/             Domain types and form fields
│   ├── env/                Type-safe environment variables
│   ├── error/              ApiError, message mapping, view
│   ├── form/               effect-form wrapper + dialogs
│   ├── http/               XSRF-aware get/post, ObjekatIdentifikator
│   ├── memo/               Identity-keyed memoize
│   ├── pretraga/           Predicates, sorting, paging, table components
│   ├── theme/              Global styles
│   └── toast/              Notifications as Cmd
├── sifarnici/              Reference-data area (vozac: search + CRUD)
└── evidencija-vozila/      Vehicle records area (vozilo: search with rich filter)
```

## TEA Module Pattern

Every stateful module has exactly three files:

| File | Purpose |
|------|---------|
| `model.ts` | Readonly state types (record or tagged union) |
| `msg.ts` | Message types and constructors using `Data.taggedEnum` |
| `index.tsx` | Exports `init`, `update`, `view` (optionally `subscriptions`) |

```
Model -> View -> Msg -> Update -> Model
```

- `init` returns `[Model, Cmd.Cmd<Msg>]`
- `update(msg, model)` returns `[Model, Cmd.Cmd<Msg>]`
- `view(model)` returns `Html<Msg>`
- Side effects are described as `Cmd`, never performed directly

See [docs/01-arhitektura.md](docs/01-arhitektura.md).

## Adding a New Page

1. Create `src/<area>/<entity>/<use-case>/` with `model.ts`, `msg.ts`, `index.tsx`; export `route`
   and `FUNKCIONALNOSTI`
2. Register in `src/router/route.ts` (`routes` and `routeFunkcionalnosti`)
3. Add a variant to `src/router/screen-model.ts` and `src/router/screen-msg.ts`
4. Wire into `startScreen`, `updateScreen`, `screenView` and `selectedNavValue` in
   `src/router/index.tsx`
5. Add a navigation entry in `src/navigation/config.ts`

Full walkthrough: [docs/07-rute-i-autorizacija.md](docs/07-rute-i-autorizacija.md).

## Git Conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by
commitlint):

```
feat: add user list page
fix: resolve navigation drawer toggle
refactor: extract shared layout component
test: add update tests for home module
chore: update dependencies
```

The pre-commit hook runs lint-staged (ESLint + Prettier) and `tsc` to prevent bad commits.

## Environment Variables

Defined in `src/common/env/index.ts` and injected via Webpack `DefinePlugin`.

To add a new variable:

1. Update the `Env` type in `src/common/env/index.ts`
2. Add the value in both `webpack/webpack.dev.js` and `webpack/webpack.prod.js`

## License

MIT
