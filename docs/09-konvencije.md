# Konvencije

## Stil koda

Prettier je jedini arbitar formata i konfigurisan je unutar ESLint-a:

```
printWidth: 120, semi: false, singleQuote: true, trailingComma: 'all', arrowParens: 'avoid'
```

Ne raspravlja se o formatu — `yarn fix-prettier` i `yarn fix-lint`.

### Komentari

Kod se pise tako da mu komentar ne treba. Imena tipova, funkcija i poruka nose objasnjenje.

Komentar se pise **samo kada objasnjava zasto**, i to onda kada bi neko razuman inace "popravio" kod
u pogresnom smeru:

```ts
// Podrazumevani generator daje & = ? # % + i razmak, ali ostaje u ASCII-ju.
// Vozaci se zovu Secerovic i Djordjevic, pa i to mora da prodje kroz adresu.
```

```ts
/** Sve osim modela stize sa nivoa modula, pa poredjenje propsa staje na modelu filtera. */
```

Komentar koji prepricava sledecu liniju se brise.

### Ostala pravila

- Sve u modelu je `readonly`. Novo stanje se pravi sirenjem (`{ ...model, ... }`), ne izmenom.
- Bez `class`, bez `enum`, bez `namespace`. Tagovani enum-i preko `Data.taggedEnum`.
- Bez `any`. `unknown` pa dekodiranje semom (`stateValue`).
- `switch` nad `_tag` mora biti iscrpan; `Msg.$match` to namece.
- Nema mrtvog koda "za kasnije". Izuzetak je clan standarda (npr. `text` u enum modulu) — tu
  jednoobraznost vredi vise.
- Latinica bez dijakritike, i u kodu i u korisnickim porukama (`Sacuvaj`, `Vozac`, `Obrisi`).

## Commit-ovi

[Conventional Commits](https://www.conventionalcommits.org/), namece `commitlint`:

```
feat: pretraga vozila
fix: datum se gubi na pretrazi
refactor: enum domeni na jednu mapu
test: property test rute za vozace
chore(deps): podigni pakete u okviru postojecih opsega
```

Poruka commit-a je na istom jeziku kao i kod.

Husky pokrece:

| Hook | Sta |
|---|---|
| `pre-commit` | `yarn lint-staged` (eslint --fix + prettier) pa `yarn checkts` |
| `commit-msg` | `yarn commitlint` |

Hook-ovi se ne preskacu (`--no-verify`). Ako hook pada, pada s razlogom.

## Skripte

| Komanda | Sta radi |
|---|---|
| `yarn start` | Dev server na https://localhost:3000 |
| `yarn build` | Produkcijski build u `dist/` |
| `yarn checkts` | `tsc --noEmit` |
| `yarn lint` / `yarn fix-lint` | ESLint |
| `yarn prettier` / `yarn fix-prettier` | Format |
| `yarn test:unit` / `yarn test:watch` | Testovi |
| `yarn test` | prettier + checkts + testovi |

## Backend u razvoju

Dev server proksira `/api/*` na backend, sa prefiksom `/api` netaknutim, jer ga backend rute vec
sadrze. Podrazumevano `192.168.36.234:8080`:

```sh
APIHOST=192.168.1.10 APIPORT=9090 yarn start
```

`apiBaseUrl` je namerno prazan string. Zahtevi tako idu na origin dev servera i kroz proxy, pa
kolacic sesije ostaje na istom origin-u — inace bi trebalo CORS i `SameSite=None`.

## Promenljive okruzenja

`src/common/env/index.ts` je jedino mesto gde se cita `process.env`. Nova promenljiva se dodaje na
tri mesta: tip `Env`, `webpack/webpack.dev.js` i `webpack/webpack.prod.js`.

## Paketi

- Nadogradnja **u okviru postojecih opsega** (`yarn upgrade <paket>`) je rutinska.
- Major verzije se ne diraju bez odluke. Trenutno namerno stoje na mestu: React 18, TypeScript 5,
  ESLint 9, Vitest 3, Babel 7, webpack-cli 6, `@effect/platform` 0.94.
- `resolutions` u `package.json` drze Fluent pakete na jednoj kopiji. Dve kopije
  `@fluentui/react-motion` daju `presenceFn is not a function` u vreme izvrsavanja.
- Posle nadogradnje: `yarn lint`, `yarn checkts`, `yarn test:unit` — sva tri.

## Kada nesto ne radi

| Simptom | Uzrok |
|---|---|
| `presenceFn is not a function` | Dve kopije `@fluentui/react-motion`; proveri `resolutions` |
| Testovi pucaju posle nadogradnje Fluent-a | ESM/CJS; dopuni `deps.optimizer.ssr` u `vitest.config.ts` |
| Poruka greske se nikad ne prikazuje | `Annotation.message` bez pravila iza sebe |
| Combo posle `Nazad` prikazuje prazno | Vrednost nije u `toState` / `ioState` |
| Tabela prikazuje stari rezultat | Nedostaje `sameRequest` provera |
| Polje u dijalogu ne prima fokus | Dva modala kao braca umesto ugnjezdenih |
| DatePicker guta ukucan datum | `minDate` uz `allowTextInput` tiho odbacuje vrednost van opsega |
| Nova ruta se otvara bez prava | Nedostaje unos u `routeFunkcionalnosti` — od sada pada na kompajleru |
