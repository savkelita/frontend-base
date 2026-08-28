# Arhitektura

Aplikacija je pisana u TEA (The Elm Architecture) preko biblioteke
[tea-effect](https://github.com/savkelita/tea-effect). Nema React state-a koji nosi poslovnu logiku,
nema `useEffect`-a koji zove server, nema globalnog store-a.

```
Model  ->  view  ->  Msg  ->  update  ->  Model
                                 |
                                 v
                                Cmd  ->  Msg
```

## Cetiri pojma

| Pojam | Sta je | Pravilo |
|---|---|---|
| `Model` | Celokupno stanje ekrana, `readonly` | Nikad se ne menja, uvek se pravi novi |
| `Msg` | Sve sto se moze dogoditi, `Data.TaggedEnum` | Ime je dogadjaj u proslom vremenu (`Loaded`, `Sorted`) |
| `update` | `(msg, model) => [Model, Cmd]` | Cista funkcija. Bez `fetch`, bez `Date.now()`, bez `localStorage` |
| `view` | `(model) => Html<Msg>` | Cista funkcija. Ne odlucuje nista sto ne moze da se procita iz modela |

`Cmd` je **opis** posla, ne posao. `Http.send(...)` ne salje zahtev; on opisuje zahtev koji ce
runtime poslati i ciji ce rezultat stici nazad kao `Msg`. Zato je `update` moguce testirati bez
mreze i bez mock-ova.

## Ugovor modula

Svaki modul koji ima svoje stanje ima tacno tri fajla:

| Fajl | Sadrzaj |
|---|---|
| `model.ts` | `Model` tip, konstante (`LIMIT`), pomocni cisti izrazi nad modelom |
| `msg.ts` | `Msg` tagovani enum i **konstruktor po varijanti** |
| `index.tsx` | `init`, `update`, `view` (po potrebi `subscriptions`), i re-export `./model` i `./msg` |

```ts
export * from './model'
export * from './msg'
```

Konstruktori poruka su obavezni, ne opcioni:

```ts
export const sorted = (sort: Sort<VozacOrder>): Msg => Msg.Sorted({ sort })
```

Bez njih `Cmd.map(...)` i `Html.map(...)` bi na pozivnom mestu primali anonimne lambde, pa bi svaki
render pravio novu funkciju i rusio memoizaciju.

## Ugnjezdavanje

Roditelj drzi model deteta i ima jednu varijantu poruke koja obavija detetovu:

```ts
FilterMsg: { readonly msg: Filter.Msg }
```

```ts
FilterMsg: ({ msg: msgFilter }): [Model, Cmd.Cmd<Msg>] => {
  const [filterModel, filterCmd] = Filter.update(msgFilter, model.filterModel)
  return [{ ...model, filterModel }, Cmd.map(filterMsg)(filterCmd)]
}
```

- `Cmd.map(ctor)(cmd)` prevodi detetove komande u roditeljeve poruke
- `Html.map(ctor)(html)` isto to za prikaz

Roditelj sme da **presretne** detetovu poruku pre nego sto je prosledi. To je jedini nacin da dete
ostane nesvesno konteksta:

```ts
if (msgKreiranje._tag === 'Saved') {
  const [next, cmd] = reload({ ...model, kreiranje: Option.none() })
  return [next, Cmd.batch([cmd, Toast.success('Vozac je sacuvan.')])]
}
```

Modul `kreiranje` ne zna da postoji tabela koju treba osveziti, ni da postoji toast. On samo javi
`Saved`. Ekran odlucuje sta to znaci.

## Sta ide u `Cmd`

`Cmd<Msg>` je `Stream<Msg>`. Gotovi konstruktori:

| Poziv | Cemu sluzi |
|---|---|
| `Cmd.none` | Nista se ne desava |
| `Cmd.batch([a, b])` | Vise komandi odjednom |
| `Cmd.map(ctor)(cmd)` | Prevod detetovih poruka |
| `Http.send(request, { onSuccess, onError })` | HTTP poziv |
| `Navigation.pushUrl(url, state)` | Promena adrese |
| `LocalStorage.get / setIgnoreErrors / removeIgnoreErrors` | Trajno stanje pregledaca |
| `Toast.success(...)`, `Toast.failure(...)` | Notifikacija |

Port (`Cmd` koji preko globalnog handler-a dodiruje spoljni svet, kao `common/toast`) opravdan je
samo za stanje koje **zaista zivi izvan aplikacije** — DOM overlay, `localStorage`, naslov stranice.
Sve sto moze da stane u `Model` ide u `Model`.

Kada efekat treba da se sastavi sa drugim efektom, `Cmd.fromEffect` prima obican `Effect`, a
`Http.toTask` daje zahtev kao `Effect`. Tako se npr. cita sat u istom potezu sa odgovorom, umesto da
se `new Date()` provuce kroz mapper:

```ts
Cmd.fromEffect(
  Effect.match(Effect.zip(Http.toTask(Api.login(uloga)), Effect.clockWith(clock => clock.currentTimeMillis)), {
    onFailure: error => loginFailed(mapHttpError(error)),
    onSuccess: ([response, clientIssued]) => loginSucceeded(fromLoginResponse(response, uloga, clientIssued)),
  }),
)
```

## Sta ide u `Sub`

`Sub` je izvor poruka koji **traje**, za razliku od `Cmd` koji se javi jednom. Sat, `matchMedia`,
`WebSocket`, dogadjaj prozora. `Sub` je `Stream`, pa se pise Effect-om kao i sve ostalo.

Jedini `Sub` u projektu je otkucaj koji prati istek sesije:

```ts
Sub.withKey(
  'istek-sesije',
  Stream.repeatEffectWithSchedule(
    Effect.clockWith(clock => Effect.map(clock.currentTimeMillis, otkucaj)),
    Schedule.fixed('10 seconds'),
  ),
)
```

Dve stvari koje se lako promase:

- **`Schedule.fixed`, ne `spaced`.** `fixed` emituje odmah pa drzi ritam; `spaced` ceka pun interval
  pre prvog otkucaja i meri pauzu od kraja prethodnog posla, pa vremenom zanosi.
- **Kljuc mora biti stabilan.** `subscriptions(model)` se poziva pri svakoj promeni modela i pravi
  nov objekat toka. Runtime razlikuje pretplate po kljucu (`Sub.map` ga cuva kao `${kljuc}:map`); bez
  kljuca bi svaku promenu video kao novu pretplatu i stalno gasio i palio izvor.

Otkucaj se bira prema onome sto se **vidi**, ne prema onome sto se meri: tekst se menja najvise
jednom u minutu, pa bi otkucaj u sekundi samo prolazio kroz ceo prikaz sezdeset puta uzalud.

Posto vreme dolazi iz Effect-ovog `Clock`-a, test ritam proverava na `TestClock`-u, bez cekanja.

## Bez odbrambenih provera

Ako prikaz odlucuje da li se poruka uopste moze poslati, `update` **ne proverava to ponovo**.

Dugme `Novi vozac` se crta samo ako korisnik ima funkcionalnost `KreiranjeVozaca`. Zato
`StartKreiranje` u `update`-u ne pita za autorizaciju — poruka moze da stigne samo odatle. Jedina
zastita je test prikaza:

```ts
it('nema ga bez funkcionalnosti', () => {
  expect(draw(emptyAuthorization)).not.toContain('Novi vozac')
})
```

Duplirana provera nije bezbednija, samo pomera pitanje "gde je pravilo" na dva mesta.

Provere koje **ostaju** su one koje cuvaju invarijantu modela, ne autorizaciju:

```ts
if (Option.isNone(model.kreiranje)) return [model, Cmd.none]
if (model.isSubmitting) return [model, Cmd.none]
```

## React ispod TEA

`view` vraca `Html<Msg>`, tj. `(dispatch) => ReactNode`. React se koristi samo kao crtac.

- `Html.map` kesira mapirani `dispatch` u `WeakMap`, pa je isti izmedju render-a. Zato `React.memo`
  granice **rade** i vredi ih postavljati (`Table`, `Paging`, `FilterShell`).
- `dispatch` je sinhron. Kontrolisana polja za unos zavise od toga — asinhroni dispatch bi im
  vracao kursor na kraj teksta.
- Za `dispatch`-eve koji se prave u komponenti koristi se `memoize` iz `common/memo`, koji kesira po
  identitetu `dispatch`-a:

```ts
const dispatchers = memoize((dispatch: Platform.Dispatch<Msg>) => ({
  selectRow: (rows: ReadonlyArray<Vozac>) => dispatch(selectionChanged(rows)),
  retryLoad: () => dispatch(retry()),
}))
```

## Vrh aplikacije

`src/index.tsx` pokrece program, `src/router/index.tsx` je jedini pravi orkestrator:

```
Model
├── Initializing   cita sesiju iz localStorage
├── Anonymous      Login.Model
└── Authenticated  session + location + ScreenModel + Nav.Model
```

`ScreenModel` je tagovani enum svih ekrana, `ScreenMsg` svih njihovih poruka. Router ne zna nista o
sadrzaju ekrana — samo ih pravi (`startScreen`), prosledjuje poruke (`updateScreen`) i crta
(`screenView`).
