# Testiranje

Vitest. Testovi zive u `test/` folderu pored modula i imaju nastavak `.test.ts`.

```
src/sifarnici/vozac/pretraga/
├── index.tsx
└── test/
    ├── update.test.ts
    ├── route.test.ts
    └── view.test.ts
```

`.tsx` testovi se ne pokupljaju (`include: ['src/**/*.test.ts']`). Ako testu treba JSX, ide kroz
`renderToStaticMarkup`, ne kroz `.tsx` fajl.

## Sta se testira

| Sta | Zasto |
|---|---|
| `update` | Tu je sva logika. Cista funkcija, bez mock-ova |
| Ruta u oba smera | Kriterijumi prezive adresu bez gubitka |
| Prikaz, samo za autorizaciju | Jer je prikaz jedini cuvar |
| Cisti pomocni moduli (`predicate`, `telefon`, `number`, `error`) | Pravila koja se lako tiho pokvare |

Ne testira se: da Fluent crta dugme, da React postavlja `className`, da `Schema.String` odbija broj.

## `update`

`update` je `(msg, model) => [Model, Cmd]`. Test daje model i poruku i proverava novi model:

```ts
const [next] = update(loaded(request, page), model)
expect(rows(next.data)).toStrictEqual([vozac])
```

Komanda se ne pokrece. Ako treba proveriti da je nesto poslato, proverava se da komanda **nije**
`Cmd.none`, ili se testira funkcija koja je gradi (`toCriteria`, `toCmd`, `toRequest`).

Poruke koje ne smeju nista da urade se testiraju isto tako — zakasneli odgovor:

```ts
const [next] = update(loaded(starijiZahtev, stranaB), model)
expect(next).toBe(model)
```

## Ruta u oba smera

Kriterijumi prolaze kroz `Router.format` pa nazad kroz `Router.parse`. Sve sto udje mora da izadje
identicno. To se ne moze pokriti primerima, pa se koristi `FastCheck`:

```ts
const krozAdresu = (query: Query): Query | null => {
  const url = Router.format(routes.vozaci, query)
  const [pathname, search] = url.split('?')
  const parsed = Router.parse(routes, { pathname: pathname ?? '', search: search === undefined ? '' : `?${search}` })
  if (!Option.isSome(parsed) || parsed.value._tag !== 'vozaci') return null
  return parsed.value.query
}

FastCheck.assert(
  FastCheck.property(upit, query => { expect(krozAdresu(query)).toStrictEqual(query) }),
  { numRuns: 500 },
)
```

Generator se dopunjava rucno onim sto podrazumevani propusta — cirilica, dijakritika, `&`, `=`,
`#`, `%41`, `a+b`, emoji. Svaki novi ekran pretrage dobija ovakav test.

## Prikaz

Samo tamo gde prikaz nosi pravilo:

```ts
const draw = (config: AuthorizationConfig): string =>
  renderToStaticMarkup(view(config, init({}, undefined)[0])(() => {}))

it('nema ga bez funkcionalnosti', () => {
  expect(draw(emptyAuthorization)).not.toContain('Novi vozac')
})
```

`dispatch` je `() => {}` — u testu nema petlje.

## Okruzenje

`environment: 'node'`. Nema DOM-a, nema `window`-a. Test ne moze da klikne dugme; to nije
propust nego granica: sve sto se moze kliknuti mora da se svede na poruku, a poruke se testiraju
kroz `update`.

**Vremenska zona je fiksirana** na `Europe/Belgrade`:

```ts
env: { TZ: 'Europe/Belgrade' }
```

Bez toga bi datumski testovi na UTC masini prolazili i sa pogresnom implementacijom, a pucali kod
razvojnog tima.

`deps.optimizer.ssr` nabraja Fluent pakete zato sto su ESM/CJS mesavina koju Vite mora da obradi.
Ako se posle nadogradnje Fluent-a testovi sruse na `Cannot find module` ili `is not a function`, tu
je mesto za dopunu.

## Pokretanje

```sh
yarn test:unit     # jednom
yarn test:watch    # u petlji
yarn test          # prettier + checkts + testovi
```

Pre commit-a se `lint-staged` i `tsc` pokrecu sami (husky). To ne zamenjuje `yarn test`.
