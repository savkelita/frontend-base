# Rute i autorizacija

## Kako je slozeno

Ruta zivi uz ekran, ne u routeru:

```ts
// src/sifarnici/vozac/pretraga/index.tsx
const RouteQuery = pretragaQuery(Api.ioVozacCriteria, Api.ioVozacOrder)

export const route = Router.path('/sifarnici/vozaci').query(RouteQuery)
export const PERMISSIONS: ReadonlyArray<Permission> = ['PretragaVozaca']
```

Router ih samo skuplja:

```ts
// src/router/route.ts
export const routes = Router.routes({
  home: Router.path('/'),
  vozaci: VozaciPretraga.route,
  vozila: VozilaPretraga.route,
})

const PERMISSIONS_BY_ROUTE: Record<Route['_tag'], ReadonlyArray<Permission>> = {
  home: [],
  vozaci: VozaciPretraga.PERMISSIONS,
  vozila: VozilaPretraga.PERMISSIONS,
}
```

Kljuc je `Route['_tag']`, ne `string`, i nema `?? []` na citanju. Ruta bez unosa pada na kompajleru
umesto da tiho postane javna. Ruta koja stvarno ne trazi nista se to i kaze, praznim spiskom.

## Dodavanje rute

Sest koraka. Kompajler ce prijaviti svaki propusten osim poslednjeg.

**1. Ekran.** `src/<oblast>/<entitet>/<slucaj>/` sa `model.ts`, `msg.ts`, `index.tsx`. Izvezi
`route` i `PERMISSIONS`.

**2. `src/router/route.ts`** — dodaj u `routes` i u `PERMISSIONS_BY_ROUTE`.

**3. `src/router/screen-model.ts`** — nova varijanta i njen konstruktor:

```ts
VozilaScreen: { readonly model: VozilaPretraga.Model }
export const vozilaScreen = (model: VozilaPretraga.Model): ScreenModel => ScreenModel.VozilaScreen({ model })
```

**4. `src/router/screen-msg.ts`** — isto za poruku.

**5. `src/router/index.tsx`** — tri mesta:

```ts
// startScreen
case 'vozila': {
  const [model, cmd] = VozilaPretraga.init(route.query, state, previous?._tag === 'VozilaScreen' ? previous.model : undefined)
  return [vozilaScreen(model), Cmd.map(vozilaMsg)(cmd)]
}

// updateScreen
VozilaMsg: ({ msg: vozilaMessage }) => {
  if (screenModel._tag !== 'VozilaScreen') return [screenModel, Cmd.none]
  const [model, cmd] = VozilaPretraga.update(vozilaMessage, screenModel.model)
  return [vozilaScreen(model), Cmd.map(vozilaMsg)(cmd)]
}

// screenView
VozilaScreen: ({ model }) => Html.map(vozilaMsg)(VozilaPretraga.view(model))(dispatch)
```

i cetvrto, `selectedNavValue`, koje kaze koja stavka menija se osvetljava:

```ts
VozilaScreen: () => 'vozila',
```

**6. `src/navigation/config.ts`** — stavka menija:

```ts
navigationLink('vozila', 'Vozila', Router.format(routes.vozila, {}), {
  requiredPermissions: ['PretragaVozila'],
})
```

Kljuc stavke (`'vozila'`) mora biti isti string koji vraca `selectedNavValue`.

## `previous`

`startScreen` prima prethodni `ScreenModel`:

```ts
previous?._tag === 'VozilaScreen' ? previous.model : undefined
```

Kada se menja samo upit iste rute (druga strana, drugo sortiranje), ekran dobija svoj stari model i
iz njega moze da preuzme ono sto se ne vidi u adresi — otvorenost fioke filtera, vec ucitane combo
objekte, i prethodnu stranu tabele da ne treperi. Ako je prethodni ekran bio drugi, `undefined`, i
sve krece ispocetka.

## Autorizacija

Sesija nosi listu funkcionalnosti koje korisnik ima:

```ts
export type AuthorizationConfig = { readonly permissions: ReadonlyArray<string> }
```

Nazivi funkcionalnosti su nabrojani na jednom mestu:

```ts
// src/auth/types.ts
export const PERMISSIONS = [
  'PretragaVozaca', 'KreiranjeVozaca', 'AzuriranjeVozaca', 'BrisanjeVozaca', 'PretragaVozila',
] as const

export type Permission = (typeof PERMISSIONS)[number]
```

Niz je izvor tipa, pa se ime funkcionalnosti ne moze pogresno napisati nigde u aplikaciji.

### Tri mesta gde se proverava

| Mesto | Sta radi | Kako |
|---|---|---|
| Ruta | Odbija ceo ekran | `startScreenWithAuth` vraca `UnauthorizedScreen` |
| Meni | Skriva stavku | `buildNavigation(config)` |
| Dugme | Skriva radnju | `Kreiranje.button(config, ...)` vraca `null` |

Sva tri koriste `hasAllPermissions(config, trazene)`. Prazan zahtev prolazi (`home`).

Provera na ruti je jedina obavezna — bez nje bi rucno ukucana adresa otvorila ekran. Meni i dugmad
su udobnost, ali se **ne dupliraju u `update`-u**. Vidi
[01 Arhitektura](01-arhitektura.md#bez-odbrambenih-provera).

Zato je `src/router/test/authorization.test.ts` obavezan pratilac svake nove rute: proverava da se
sa pravom otvara ekran, da se bez prava dobija `UnauthorizedScreen`, i da pravo za jedan ekran ne
otvara drugi.

### Dodavanje funkcionalnosti

1. Dodaj naziv u `PERMISSIONS` u `src/auth/types.ts` (mora se poklopiti sa backend-om).
2. Navedi je u `PERMISSIONS` ekrana ili u lokalnoj konstanti modula:

```ts
// src/sifarnici/vozac/kreiranje/index.tsx
const PERMISSIONS: ReadonlyArray<Permission> = ['KreiranjeVozaca']
const isAuthorized = (config: AuthorizationConfig): boolean => hasAllPermissions(config, PERMISSIONS)
```

3. Ako gasi ceo ekran, upisi je i u `PERMISSIONS_BY_ROUTE`.
4. Napisi test prikaza da dugmeta nema bez funkcionalnosti — to je jedina zastita.

## Sesija

`router/init` cita sesiju iz `localStorage` (`SESSION_KEY`). Dok cita, model je `Initializing`.

- Ima sesije → `Authenticated`, ruta se parsira, ekran se pravi.
- Nema je (ili je neispravna) → `Anonymous`, prikazuje se `Login`.

Prijava ide u dva koraka: `identifikuj` vraca uloge korisnika, `login(uloga)` vraca sesiju. Uspesna
prijava upisuje sesiju u `localStorage` i odmah prelazi u `Authenticated`.

**`Anonymous` nosi adresu.** Neprijavljeni korisnik koji otvori poslat link ostaje na toj adresi —
router ne radi `pushUrl`, samo crta prijavu — pa se posle prijave nastavlja tamo gde je posao, a ne
na pocetnoj. Isto vazi posle odjave i posle isteka sesije. Adresa se prati i dok nema sesije
(`UrlChanged` je azurira), da `Nazad` u pregledacu ne razidje zapamceni cilj sa onim sto pise u
traci.

Zapamcena adresa ne zaobilazi nista: prolazi kroz istu proveru prava, pa se link na ekran bez prava
zavrsava na `UnauthorizedScreen`.

Odjava brise `localStorage`, salje `logout` i vraca na `Anonymous` — tim redom, i ne ceka odgovor
servera.

Kolacic i XSRF zaglavlje dodaje `common/http/request`, ne modul autentifikacije.

### Podizanje ne veruje samo `localStorage`-u

Sesiju cine **dva kolacica** — `TOKEN` (HttpOnly, nedostupan iz JS-a) i `XSRF-TOKEN` (citljiv). Oba
imaju rok i pregledac ih sam brise kad prodje. `localStorage` nema rok i niko ga ne cisti, pa ta
dva izvora mogu da se razidju.

Zato `init` ne uzima zapamcenu sesiju na rec:

```ts
const rememberedSession = Effect.map(
  Effect.all([
    LocalStorage.getTask(SESSION_KEY, Session),
    Effect.sync(() => hasXsrfToken(document.cookie)),
    Effect.clockWith(clock => clock.currentTimeMillis),
  ]),
  ([remembered, hasCookie, now]) => Option.filter(remembered, s => canResume(s, now, hasCookie)),
)
```

Bez ovoga bi se aplikacija digla kao prijavljena, iscrtala ceo ekran i ispalila zahtev koji vrati
401 — a iz 401 po pravilu iznad **ne smemo** da zakljucimo da je sesija istekla, pa bi korisnik
gledao gresku umesto prijave.

Provera kolacica vazi **samo u jednom smeru**: nema XSRF-a znaci da sesije sigurno nema, ima ga ne
garantuje da je ziva (token sesije se ne moze procitati). Oslanja se na to da se oba brisu zajedno.

**Ista provera ide i u otkucaj**, da garancija ne zavisi od toga *kako* je sesija nestala. Obrisani
kolacici i istekli kolacici su za pregledac ista stvar — `document.cookie` ih prosto nema. Istek
hvatamo jer smo vreme zapamtili u modelu; brisanje se ne najavljuje nicim, pa bi se bez ovoga
primetilo tek pri sledecem podizanju:

```ts
Tick: { readonly now: number; readonly hasCookie: boolean }
```

Pretplata cita svet (sat i kolacic), poruka nosi oboje, `update` ostaje cist. Ruter onda ima jedno
pravilo umesto dva — **sesija je gotova kad joj istekne vreme ili kad joj nestanu kolacici** — i
jednu granu, jer korisniku je svejedno zasto je gotova.

`initial.hasCookie` je `true`, i to nije pretpostavka: do `Authenticated` se stiglo tek posto je
provera pri podizanju prosla.

### Sesija i vise tabova

Kolacic dele svi tabovi, model ne. Zato ruter slusa `storage` dogadjaj, koji se po specifikaciji
okida **samo za druge dokumente**:

```ts
LocalStorage.onChange(SESSION_KEY, Session, {
  onSuccess: sessionChanged,
  onError: () => sessionChanged(Option.none()),
})
```

Pretplata radi u **svakom** stanju rutera — i anoniman tab mora da sazna da si se prijavio negde
drugde. `update` grana po identitetu:

| sta se desilo | sta tab uradi |
|---|---|
| kljuc obrisan | `initAnonymous` + upozorenje da si odjavljen u drugom prozoru |
| drugi identitet | `initAuthenticated` na tekucoj adresi + obavestenje ko si sada |
| isti identitet | zameni `session` u mestu — bez poruke, bez rusenja ekrana |

Identitet se **izvodi iz seme**, da se spisak polja ne odrzava rucno:

```ts
export const sameIdentity: Equivalence.Equivalence<Session> = Schema.equivalence(Session.omit('expiration'))
```

`expiration` je jedini izuzetak jer produzenje sesije pomera samo rok. **Treca grana je tu zbog
toga** — kad stigne refresh token, isti korisnik sa novim rokom ne sme da izgubi ono sto radi.

Bez ovoga je odjava u jednom tabu ostavljala drugi da izgleda prijavljeno i puca na 401, a prijava
drugim nalogom je ostavljala staro ime u zaglavlju i stara prava na dugmadima — dok su se zahtevi
izvrsavali kao novi korisnik.

### Istek sesije

**401 ne znaci da je sesija istekla.** Isti status stize i kada je korisnik prijavljen ali nema pravo
na taj poziv — server na to odgovara sa
`{"type":"SYSTEM","code":"5501","message":"Nemate pravo na izvršenje funkcionalnosti."}`. Automatska
odjava na svaki 401 izbacila bi korisnika zato sto je kliknuo nesto sto ne sme. Zato se iz 401 ne
zakljucuje nista o sesiji, nego se prikaze poruka koju je server poslao.

Sesija ima poznat rok, pa se istek racuna **iz sata**. `src/auth/session-expiration/` to prati.

`LoginResponse` nosi `issued` i `expiration` — dva serverska trenutka. Njihova razlika je trajanje i
ne zavisi od toga koliko se satovi servera i pregledaca razilaze. Na klijentov sat prelazi tek kroz
`clientIssued`, cas kada je odgovor stigao:

```ts
expiration: clientIssued + (response.expiration.getTime() - response.issued.getTime())
```

`expiration` je obican broj (milisekunde), ne `Date`. Kroz `localStorage` `Date` bi se vratio pomeren za
vremensku zonu, jer ga `JSON` pise u UTC-u a nas `DateTime` kodek cita kao lokalno vreme.

Sat je izvan aplikacije, pa ulazi kroz pretplatu, i tece samo dok je
neko prijavljen:

```ts
export const subscriptions = (model: Model): Sub.Sub<Msg> =>
  model._tag === 'Authenticated' ? Sub.map(sessionExpiration)(SessionExpiration.subscriptions()) : Sub.none
```

Modul javlja samo vreme; sta ono znaci odlucuje router: na pragu se prikazuje dijalog, na isteku se
korisnik odjavljuje uz obavestenje. Pre prvog otkucaja `remaining` je `Option.none()` — nista se jos
nije izmerilo, pa se nista i ne tvrdi.

Kada backend dobije produzetak, dodaje se `POST /api/administracija/extendSession` u
`auth/api/routes.ts`, poruka `Produzi` u `session-expiration/msg.ts`, dugme u dijalogu, i router na
uspesan odgovor upisuje novu `expiration`. Sve ostalo ostaje kako jeste.
