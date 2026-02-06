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
│   └── env/index.ts         # Type-safe environment variables
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
