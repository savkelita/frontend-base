# frontend-base

Base project for admin applications using the
[tea-effect](https://github.com/savkelita/tea-effect) architecture.

> **Developer documentation lives in [docs/](docs/README.md)** (Serbian). It is the source of truth
> for how work is done here: module layout, naming, API conventions, domain types, forms, search
> screens, routes, authorization, testing, and step-by-step recipes. Read it before writing code.

## Requirements

- **Node 20 or newer** (developed on 24)
- **Yarn 1.22** (classic)

## Getting Started

```sh
yarn install
yarn start
```

Open https://localhost:3000

## Tech Stack

- **Architecture**: tea-effect (The Elm Architecture + Effect)
- **Forms**: [effect-form](https://www.npmjs.com/package/effect-form) — the schema carries the widget
- **UI**: React 18 + Fluent UI 9
- **Language**: TypeScript 5
- **Build**: Webpack 5 + Babel
- **Linting**: ESLint 9 (flat config) + Prettier 3
- **Testing**: Vitest, `TestClock` from `effect/testing`, property tests through `fast-check`
- **Git hooks**: Husky + lint-staged + commitlint

## Before You Call It Done

```sh
yarn checkts && yarn lint && yarn test:unit
```

Continuous integration runs on Azure Pipelines. The pre-commit hook runs lint-staged (ESLint +
Prettier) and `tsc`; that is not a substitute for the command above.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Dev server at https://localhost:3000 |
| `yarn build` | Production build to `dist/` |
| `yarn checkts` | TypeScript type checking |
| `yarn lint` | ESLint check |
| `yarn test:unit` | Run unit tests (Vitest) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test` | prettier + checkts + unit tests |
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
├── auth/                   Session, permissions, roles, expiration
├── common/                 Shared building blocks
│   ├── audit/              Audit schema + table cell
│   ├── domain/             Domain types and form fields
│   ├── env/                Type-safe environment variables
│   ├── error/              ApiError, message mapping, view
│   ├── form/               effect-form wrapper + dialogs
│   ├── http/               XSRF-aware get/post, ObjekatIdentifikator
│   ├── memo/               Identity-keyed memoize
│   ├── pretraga/           Operators, predicates, filter fields, sorting, paging, table
│   ├── theme/              Global styles
│   └── toast/              Notifications as Cmd
├── testing/                What tests use (DOM harness); not part of the application
├── sifarnici/              Reference data (vozac: search, CRUD, detail with a nested list)
└── evidencija-vozila/      Vehicle records (vozilo: search with a rich filter)
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

## Adding a Screen

Six steps, all but the last caught by the compiler:
[docs/07-rute-i-autorizacija.md](docs/07-rute-i-autorizacija.md#dodavanje-rute). Do not invent a new
shape — copy the nearest existing screen and change it.

## Environment Variables

`src/common/env/index.ts` is the only place `process.env` is read. A new variable goes in three
places: the `Env` type, `webpack/webpack.dev.js` and `webpack/webpack.prod.js`. See
[docs/09-konvencije.md](docs/09-konvencije.md#promenljive-okruzenja).

## Git Conventions

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint:

```
feat: pretraga vozila
fix: datum se gubi na pretrazi
refactor: enum domeni na jednu mapu
test: property test rute za vozace
chore(deps): podigni pakete u okviru postojecih opsega
```

Hooks are not skipped (`--no-verify`). A failing hook fails for a reason.
