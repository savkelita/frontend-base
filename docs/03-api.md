# API sloj

Backend ima svoju konvenciju i frontend joj se prilagodjava, a ne obrnuto.

## Oblik poziva

| Vrsta | Metod | Primer | Odgovor |
|---|---|---|---|
| Pretraga | `GET` | `/api/sifarnik/pretraziVozac?...` | `PretragaResponse<A>` |
| Citanje jednog | `GET` | `/api/sifarnik/dajVozac/{id}` | `VozacInfo` |
| Kreiranje | `POST` | `/api/sifarnik/kreirajVozac` | `ObjekatIdentifikator` |
| Izmena | `POST` | `/api/sifarnik/azurirajVozac` | prazno telo |
| Brisanje | `POST` | `/api/sifarnik/obrisiVozac` | prazno telo |

Ime rute je glagol pa entitet (`pretraziVozac`, `kreirajVozac`), i funkcija u `routes.ts` zove se
isto tako.

## `oblast/api/routes.ts`

Jedna funkcija po ruti, bez ikakve logike osim sastavljanja zahteva:

```ts
export const pretraziVozac = (
  request: PretragaRequest<VozacCriteria, VozacOrder>,
): Http.Request<PretragaResponse<Vozac>> =>
  get(withQuery('/api/sifarnik/pretraziVozac', request), Http.expectJson(ioPretragaResponse(Vozac)))

export const azurirajVozac = (cmd: AzurirajVozacCmd): Http.Request<void> =>
  post('/api/sifarnik/azurirajVozac', Http.jsonBody(AzurirajVozacCmd, cmd), expectNoContent)
```

`get` i `post` dolaze iz `common/http/request`, ne iz `tea-effect/Http` direktno. Oni dodaju
kolacice i XSRF zaglavlje (`X-XSRF-TOKEN` iz `XSRF-TOKEN` kolacica). Poziv koji ih zaobidje proci
ce u dev-u i pasti u produkciji.

`expectNoContent` je za odgovore bez tela. Prazan string, `null` i prazan objekat su svi validno
"nista".

## `oblast/api/types.ts`

Ovde stoje **samo seme zice**. Bez `Annotation`-a, bez widget-a, bez `null`-a koji postoji zato sto
je forma prazna.

```ts
export const Vozac = Schema.Struct({
  id: Schema.Number,
  version: Schema.Number,
  ime: Schema.String,
  email: Schema.NullOr(Schema.String),
  kategorije: Schema.Array(KategorijaVozacaInfo),
  stanje: StanjeVozaca.ioValue,
  audit: Audit,
})
export type Vozac = typeof Vozac.Type
```

Tri odvojena tipa za isti entitet su normalna i namerna stvar:

| Tip | Cemu sluzi |
|---|---|
| `Vozac` | Red u tabeli pretrage (ima `audit`) |
| `VozacInfo` | Jedan zapis za izmenu (nema `audit`) |
| `KreirajVozacCmd` / `AzurirajVozacCmd` | Sta se salje |
| `VozacCombo` | Minimum za padajucu listu |

Ne pravi se jedan "veliki" tip sa opcionim poljima.

### Kriterijumi i sortiranje

```ts
export const ioVozacOrder = Schema.Literal('prezime', 'ime', 'imeZaPrikaz', 'email', 'telefon', 'stanje')
export type VozacOrder = typeof ioVozacOrder.Type

export type VozacCriteria = {
  readonly ime?: StringPredicate
  readonly kategorijaID?: number
  readonly stanje?: EnumPredicate<StanjeVozaca.Value>
}
```

Kriterijum je **opcion**. Odsutan kriterijum znaci "ne filtriraj po tome". Zato je `undefined`, a ne
`null`.

`Order` je ono po cemu backend ume da sortira — ista lista mora da postoji i kao `attribute` na
koloni tabele.

## Predikati

Backend prima filtere kao par `[operator, vrednost]`. `common/pretraga/predicate.ts` drzi kodeke i
konstruktore:

| Kodek | Operatori | Konstruktor | Citanje nazad |
|---|---|---|---|
| `ioStringPredicate` | `eq` `neq` `contains` `starts_with` | `contains(value)` | `predicateValue(p)` |
| `ioEnumPredicate(io)` | `eq` `neq` | `eq(value)` | `predicateValue(p)` |
| `ioDatePredicate` | `eq` `before` `after` `before_or_same` `after_or_same` `between` | `range(opseg)` | `rangeValue(p)` |

Konstruktori vracaju `undefined` za praznu vrednost, sto je tacno ono sto kriterijum ocekuje.

Datumski opseg bira operator sam, prema tome sta je popunjeno:

```ts
export const range = (value: DateRange | null): DatePredicate | undefined => {
  const [od, doDatuma] = value ?? [null, null]
  if (od !== null && doDatuma !== null) return ['between', `${toYmd(od)}~${toYmd(doDatuma)}`]
  if (od !== null) return ['after_or_same', toYmd(od)]
  if (doDatuma !== null) return ['before_or_same', toYmd(doDatuma)]
  return undefined
}
```

Zato se ne validira da je "od" pre "do". Oba polja su nezavisna, a jedno popunjeno polje je
smisleni upit.

## Zahtev i odgovor pretrage

```ts
export type PretragaRequest<C extends Criteria, O extends string> = {
  readonly criteria: C
  readonly order_: ReadonlyArray<Order<O>>
  readonly limit_?: number
  readonly offset_?: number
  readonly lop_?: 'AND' | 'OR'
}

export type PretragaResponse<A> = {
  readonly total_: number
  readonly offset_: number
  readonly result: ReadonlyArray<A>
}
```

`withQuery(pathname, request)` pretvara zahtev u query string: kriterijumi kao ponovljeni parametri,
sortiranje kao par `order_=atribut&order_=smer`.

## Optimisticko zakljucavanje

`ObjekatIdentifikator` je `{ id, version }`. `version` stize sa servera pri citanju i vraca se pri
izmeni i brisanju. Nikad se ne izmislja i ne cuva odvojeno od zapisa iz kog je stigao.

```ts
Http.send(Api.obrisiVozac({ id: vozac.id, version: vozac.version }), { ... })
```

## Greske

Dva sloja, i ne mesaju se.

**`ApiError`** (`common/error/error.ts`) je ono sto se dogodilo tehnicki. `mapHttpError` prevodi
`Http.HttpError` u njega; status 400 i 401 nose `ServerError`-e koje je backend poslao:

```ts
BadRequest | Unauthorized | NotFound | ServerFailure | Unavailable
| Timeout | UnexpectedStatus | NetworkError | BadResponse | BadRequestPayload
```

**`reportError`** (`common/error/report.ts`) prevodi `ApiError` u `ErrorReport` — poruke za korisnika
i `severity`. Samo `BUSINESS` greske sa `severity: 'WARNING'` daju upozorenje; sve ostalo je greska.

### 401 nosi telo

Validaciona greska stize kao **lista**, a odbijeno ovlascenje kao **jedan objekat**; `parseErrors`
prima oba oblika. Zato se poruka servera koristi kad postoji:

```ts
Unauthorized: ({ errors }) =>
  errors.length === 0 ? message('Nemate ovlascenje za ovu funkciju ili je sesija prekinuta.') : fromServer(errors),
```

Nasa poruka je poslednje pribeziste jer 401 pokriva dva razlicita slucaja — pogresnu lozinku i
nedostatak prava — a samo server zna koji je. Iz istog razloga se **iz 401 ne zakljucuje da je sesija
istekla**; to se racuna iz sata, vidi
[07 Rute i autorizacija](07-rute-i-autorizacija.md#istek-sesije).

Pravilo: **serverska greska nikad ne postaje `Issue` forme.** Validacija i ishod zahteva su dva
kanala. `401` nije "polje nije ispravno". U modelu stoje odvojeno:

```ts
readonly showErrors: boolean          // kanal validacije
readonly error: Option.Option<ApiError>   // kanal zahteva
```

i crtaju se odvojeno — `issues` u formu, `<ErrorView report={reportError(...)} />` ispod nje.
