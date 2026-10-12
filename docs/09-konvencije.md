# Konvencije

## Jezik u kodu

**Arhitektura se imenuje na engleskom. Aplikacija i sav tekst idu na srpskom.** Mesanje unutar
jednog imena (`hasAllFunkcionalnosti`, `getRouteFunkcionalnosti`) je najgora varijanta — citalac ne
zna po cemu da trazi.

| engleski | srpski |
|---|---|
| `auth/`, `router/`, `common/`, `login/`, `navigation/` i sve u njima | `sifarnici/`, `evidencija-vozila/` i uloge `pretraga` / `kreiranje` / `azuriranje` / `brisanje` / `pregled` |
| TEA instalacija, lokalne promenljive, kljucevi `makeStyles`, imena test fajlova u infrastrukturi | domenski moduli oblasti (`sifarnici/domain/*`, `evidencija-vozila/domain/istek-registracije`) |
| `common/domain/*` — to je infrastruktura (`phone`, `file`, `PREFIX`, `MIN_DIGITS`, `calendar`) | **svaki tekst** — poruke korisniku, `aria-label`, i svi `describe` / `it` opisi |

**Granica je zica.** Imena koja dolaze sa servera ostaju kakva jesu, i tu je mesanje u redu jer
pokazuje odakle sta dolazi:

```ts
// ruta i tipovi prate backend
export const identifikuj = (cmd: IdentifikujCmd) => post('/api/administracija/identifikuj', ...)

// prevod na nase ime se desi jednom i vidi se
export const toAuthorizationConfig = (session: Session): AuthorizationConfig => ({
  permissions: session.funkcionalnosti,
})
```

Provera koja resava vecinu dilema: **ako polje nije u `api/types.ts`, nije sa zice** — znaci ide na
engleski. Tip koji si sam izmislio nije ugovor sa serverom.

Pri masovnom preimenovanju `sed`-om: granica reci (`\b`) ulazi i u srpski tekst u navodnicima i u
nepovezane identifikatore. Posle svakog takvog zahvata pregledaj `git diff` na `it(` / `describe(`
nizove i na pragme (`// @vitest-environment`), koje nisu komentari.

## Stil koda

Prettier je jedini arbitar formata i konfigurisan je unutar ESLint-a:

```
printWidth: 120, semi: false, singleQuote: true, trailingComma: 'all', arrowParens: 'avoid'
```

Ne raspravlja se o formatu — `yarn fix-prettier` i `yarn fix-lint`.

### Komentari

**Komentara nema.** Kod se pise tako da mu komentar ne treba — imena tipova, funkcija i poruka nose
objasnjenje, a ono sto bi inace islo u komentar ide u test cije ime to kaze naglas.

U `src/` izvan testova ih trenutno nema nijednog. Ako ti se cini da ti komentar treba, to je znak da
ime nije dobro ili da nedostaje test.

Izuzetak su **pragme**, koje nisu komentari nego direktive i ne smeju da se brisu:

```ts
// @vitest-environment happy-dom
```

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
| Nova ruta se otvara bez prava | Nedostaje unos u `PERMISSIONS_BY_ROUTE` — od sada pada na kompajleru |
