# Arhitektura

Aplikacija je pisana u TEA (The Elm Architecture) preko biblioteke
[tea-effect](https://github.com/savkelita/tea-effect). Nema React state-a koji nosi poslovnu logiku,
nema `useEffect`-a koji zove server, nema globalnog store-a. Redux store iz `common/debugger` nije
izuzetak: on je samo istorija za DevTools, vidi [Redux DevTools](#redux-devtools).

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

**Model i poruke se grade od tipova koje log prenosi.** To su JSON vrednosti (string, broj,
boolean, `null`, niz, obican objekat), tagovane vrednosti (`Data.taggedEnum`), `Option` i `Date`.
Samo njih `common/debugger/serialize` prenosi kroz izvoz i uvoz loga
(vidi [Redux DevTools](#redux-devtools)).

- Koristi se ono sto vec postoji: niz umesto `Set`, objekat ili niz parova umesto `Map`, tagovana
  vrednost umesto klase.
- Ako novi tip zaista treba, dodaje se u `serialize` u istoj izmeni: grana u `replacer`-u, oznaka u
  `ioMark`, vracanje u `unmark` i test. Bez toga log i skok kroz istoriju rade, ali uvezeni log tiho
  daje pogresna stanja: `Set` stigne kao `{}`, a `Date` kao string.

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

Projekat ima tri pretplate, sve tri okacene na `router/subscriptions`:

| kljuc | sta slusa | zasto |
|---|---|---|
| `session-expiration` | sat | odbrojava do isteka i odjavljuje |
| `localStorage:onChange:session` | `storage` dogadjaj | odjava ili promena naloga u drugom tabu |
| `unload-guard` | `beforeunload` | zadrzava korisnika dok ima nesacuvanih izmena |

Druga i treca su opisane u [07 Rute i autorizacija](07-rute-i-autorizacija.md#sesija-i-vise-tabova)
i [05 Forme](05-forme.md#dirty). Prva izgleda ovako:

```ts
Sub.withKey(
  'session-expiration',
  Stream.repeatEffectWithSchedule(
    Effect.clockWith(clock => Effect.map(clock.currentTimeMillis, tick)),
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

## Redux DevTools

Kad pregledac ima Redux DevTools, `src/index.tsx` pokrece program kroz `common/debugger`, i u razvoju
i u produkciji. Bez prosirenja program je isti kao da debugger-a nema.

Debugger drzi pravi Redux store ciji je reducer `update` aplikacije. Model i dalje zivi u tea-effect
programu; store je istorija koju DevTools prikazuje i premotava.

- Svaka poruka ulazi pod putanjom tagova, npr. `Screen/VozaciMsg/FilterMsg/Changed`. Putanja nosi
  samo imena, nikad sadrzaj poruke.
- `update` ostaje cist. Poruka stize u store iz `subscribe` na programu, posle koraka, pa je redosled
  u istoriji redosled kojim su poruke primenjene. Kroz `Cmd` bi se redosled gubio, jer se komande
  pokrecu svaka u svom fiber-u.
- Skok, preskakanje, zakljucavanje i uvoz racunaju stanje kroz `update`, bez komandi. Zato korisnik
  moze da izveze log, a mi ga uvezemo i vidimo svaki ekran koji je on video, bez servera.
- `SessionExpiration/Tick` se ne prikazuje (`actionsDenylist`), ali ostaje u istoriji i u izvozu, pa
  uvoz ne gubi istek sesije. Pamti se poslednjih 200 poruka (`maxAge`).
- Svaka akcija nosi `build`: verziju iz `package.json` i commit (`0.1.0+61dbe74`, uz `-dirty` ako
  stablo nije bilo cisto). Uvezen log se pusta na tom build-u, jer drugi `update` daje druga stanja.
  Verzija je u svakoj akciji, a ne samo u prvoj, jer DevTools posle `maxAge` odbacuje pocetak istorije.
- Izvoz prolazi kroz `common/debugger/serialize`: `Date` i `Option` se zapisuju kao obicni objekti
  (`{ _id: 'Date', value: '2026-02-13T13:28:42.000Z' }`, `{ _id: 'Option', ... }`), a tagovane
  vrednosti kao objekti sa `_tag`. Samo obican objekat prezivi svaki put: prosirenje 3.2.10 izvozi i
  iz panela, kao obican JSON, gde bi pravi `Date` postao string. Zato su `jsan` opcije prazne
  (`options: {}`), jer bez njih prosirenje ukljuci sve `jsan` tipove, a oni na tom putu ne prezive.
- Uvoz ne racuna na `reviver` prosirenja: 3.2.10 ga poziva samo uz Immutable.js. Zato reducer sam
  ozivljava (`revive`) svaku poruku i stanje koji dolaze iz DevTools-a, pre nego sto ih vidi `update`
  ili prikaz.

**Sve sto je u modelu i u porukama ulazi u log koji korisnik moze da posalje.** Zato `serialize`
maskira svako polje cije ime sadrzi `lozinka` ili `password` (`novaLozinka`, `staraLozinka`...): u
logu je `'<redacted>'`, a prazno polje ostaje `null`. Tajno polje se zato uvek zove tako i uvek je
polje forme, a ne gola vrednost u poruci — `{ value: 'tajna' }` bez imena polja bi procurilo.
