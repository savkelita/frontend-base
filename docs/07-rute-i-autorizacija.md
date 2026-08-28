# Rute i autorizacija

## Kako je slozeno

Ruta zivi uz ekran, ne u routeru:

```ts
// src/sifarnici/vozac/pretraga/index.tsx
export const route = Router.path('/sifarnici/vozaci').query(RouteQuery)
export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozaca']
```

Router ih samo skuplja:

```ts
// src/router/route.ts
export const routes = Router.routes({
  home: Router.path('/'),
  vozaci: VozaciPretraga.route,
  vozila: VozilaPretraga.route,
})

const routeFunkcionalnosti: Record<string, ReadonlyArray<Funkcionalnost>> = {
  vozaci: VozaciPretraga.FUNKCIONALNOSTI,
  vozila: VozilaPretraga.FUNKCIONALNOSTI,
}
```

## Dodavanje rute

Sest koraka. Kompajler ce prijaviti svaki propusten osim poslednjeg.

**1. Ekran.** `src/<oblast>/<entitet>/<slucaj>/` sa `model.ts`, `msg.ts`, `index.tsx`. Izvezi
`route` i `FUNKCIONALNOSTI`.

**2. `src/router/route.ts`** — dodaj u `routes` i u `routeFunkcionalnosti`.

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
  requiredFunkcionalnosti: ['PretragaVozila'],
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
export type AuthorizationConfig = { readonly funkcionalnosti: ReadonlyArray<string> }
```

Nazivi funkcionalnosti su nabrojani na jednom mestu:

```ts
// src/auth/types.ts
export const FUNKCIONALNOSTI = [
  'PretragaVozaca', 'KreiranjeVozaca', 'AzuriranjeVozaca', 'BrisanjeVozaca', 'PretragaVozila',
] as const

export type Funkcionalnost = (typeof FUNKCIONALNOSTI)[number]
```

Niz je izvor tipa, pa se ime funkcionalnosti ne moze pogresno napisati nigde u aplikaciji.

### Tri mesta gde se proverava

| Mesto | Sta radi | Kako |
|---|---|---|
| Ruta | Odbija ceo ekran | `startScreenWithAuth` vraca `UnauthorizedScreen` |
| Meni | Skriva stavku | `buildNavigation(config)` |
| Dugme | Skriva radnju | `Kreiranje.button(config, ...)` vraca `null` |

Sva tri koriste `hasAllFunkcionalnosti(config, trazene)`. Prazan zahtev prolazi (`home`).

Provera na ruti je jedina obavezna — bez nje bi rucno ukucana adresa otvorila ekran. Meni i dugmad
su udobnost, ali se **ne dupliraju u `update`-u**. Vidi
[01 Arhitektura](01-arhitektura.md#bez-odbrambenih-provera).

### Dodavanje funkcionalnosti

1. Dodaj naziv u `FUNKCIONALNOSTI` u `src/auth/types.ts` (mora se poklopiti sa backend-om).
2. Navedi je u `FUNKCIONALNOSTI` ekrana ili u lokalnoj konstanti modula:

```ts
// src/sifarnici/vozac/kreiranje/index.tsx
const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['KreiranjeVozaca']
const isAuthorized = (config: AuthorizationConfig): boolean => hasAllFunkcionalnosti(config, FUNKCIONALNOSTI)
```

3. Ako gasi ceo ekran, upisi je i u `routeFunkcionalnosti`.
4. Napisi test prikaza da dugmeta nema bez funkcionalnosti — to je jedina zastita.

## Sesija

`router/init` cita sesiju iz `localStorage` (`SESSION_KEY`). Dok cita, model je `Initializing`.

- Ima sesije → `Authenticated`, ruta se parsira, ekran se pravi.
- Nema je (ili je neispravna) → `Anonymous`, prikazuje se `Login`.

Prijava ide u dva koraka: `identifikuj` vraca uloge korisnika, `login(uloga)` vraca sesiju. Uspesna
prijava upisuje sesiju u `localStorage` i odmah prelazi u `Authenticated`.

Odjava brise `localStorage`, salje `logout` i vraca na `Anonymous` — tim redom, i ne ceka odgovor
servera.

Kolacic i XSRF zaglavlje dodaje `common/http/request`, ne modul autentifikacije.
