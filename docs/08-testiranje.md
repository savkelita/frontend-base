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

`.tsx` testovi se ne pokupljaju (`include: ['src/**/*.test.ts']`). Testu zato ostaju dva puta do
elementa: `renderToStaticMarkup` nad onim sto `view` vec vraca, ili `createElement(Komponenta, props)`
kad se komponenta crta sama. JSX u testu ne postoji.

## Sta se testira

| Sta | Zasto |
|---|---|
| `update` | Tu je sva logika. Cista funkcija, bez mock-ova |
| Ruta u oba smera | Kriterijumi prezive adresu bez gubitka |
| Prikaz, samo za autorizaciju | Jer je prikaz jedini cuvar |
| Cisti pomocni moduli (`predicate`, `filter-*`, `telefon`, `number`, `error`) | Pravila koja se lako tiho pokvare |
| Polje koje nosi pravilo (operator, odbijanje unosa, `Esc`) | Ponasanje koje se ne vidi u ispisu |

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

## Prikaz koji se klikce

`renderToStaticMarkup` odgovara na pitanje "ima li dugmeta" i za vecinu prikaza je dovoljan. Kad
pravilo zivi u ponasanju a ne u ispisu — meni koji se otvara, polje koje odbija slovo, `Esc` nad
dijalogom — test mora da klikne. Takav fajl trazi `happy-dom`, a radnje uzima iz `src/testing/dom.ts`:

| | |
|---|---|
| `mount(element)` / `unmount()` | React koren kroz `act`; uz `afterEach(unmount)` |
| `click(element)`, `escape()` | dogadjaji |
| `type(text, index?)` | kucanje kroz izvorni setter, jer je polje kontrolisano |
| `button(label)`, `buttons()`, `input(index?)`, `inputs()` | pronalazenje |
| `menuItems()`, `menuLabels()` | stavke menija (`role="menuitemradio"`) |

`src/testing/` nije `test/`: u `test/` pored modula stoje njegovi testovi, u `testing/` ono **cime**
se testira. Nije pod `common/`, jer ne ucestvuje u aplikaciji.

I takav test proverava pravilo, ne Fluent: da `IN` pretvara listu u visestruku, da jedan ponudjen
operator ne prikazuje dugme, da `Esc` nad pitanjem vraca na formu umesto da zatvori dijalog. Da
Fluent ume da nacrta meni ne proverava niko.

## Okruzenje

`environment: 'node'` je podrazumevano i vazi za vecinu testova — `update` je cista funkcija i DOM
mu ne treba. Fajl kome DOM treba to kaze u prvom redu:

```ts
// @vitest-environment happy-dom
```

To je pragma, ne komentar, i ne brise se.

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
