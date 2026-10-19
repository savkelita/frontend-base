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
export const ioVozacOrder = Schema.Literals(['prezime', 'ime', 'imeZaPrikaz', 'email', 'telefon', 'stanje'])
export type VozacOrder = typeof ioVozacOrder.Type

export const ioVozacCriteria = Schema.Struct({
  ime: Schema.optional(ioStringPredicate),
  kategorijaID: Schema.optional(ioId),
  stanje: Schema.optional(ioEnumPredicate(StanjeVozaca.ioValue)),
})

export type VozacCriteria = typeof ioVozacCriteria.Type
```

Kriterijum je **sema, ne tip**. Tip se izvodi iz nje, a iz iste seme ekran sastavlja `RouteQuery`
kroz `pretragaQuery` — vidi [06 Pretraga](06-pretraga.md#ruta-i-upit). Da je pisan kao `type`,
kriterijumi i adresa bi se odrzavali na dva mesta i tiho razisli.

Zato su kodeci pisani onako kako polje izgleda u query stringu: `ioId`, a ne `Schema.Number`.
Kriterijumi i tako odlaze na backend kao query parametri.

Kriterijum je **opcion**. Odsutan kriterijum znaci "ne filtriraj po tome". Zato je `undefined`, a ne
`null`.

`Order` je ono po cemu backend ume da sortira — ista lista mora da postoji i kao `attribute` na
koloni tabele.

## Predikati

Backend prima filter kao par `[operator, vrednost]`, oba kao isti ponovljen query parametar:

```
?registarskaOznaka=contains&registarskaOznaka=BG
?datumIsticanjaRegistracije=between&datumIsticanjaRegistracije=2026-01-01~2026-03-31
```

Opseg je **jedan** parametar sa `RANGE_SEPARATOR` (`~`) u sredini, ne dva.

### Recnik operatora

`common/pretraga/operator.ts` je jedini spisak operatora, jedan po tipu podatka:

| Spisak | Operatori |
|---|---|
| `STRING_OPERATORS` | `eq` `neq` `contains` `starts_with` |
| `ENUM_OPERATORS` | `eq` `neq` `in` |
| `NUMBER_OPERATORS` | `eq` `neq` `gt` `gte` `lt` `lte` `between` |
| `DATE_OPERATORS` | `eq` `before` `after` `before_or_same` `after_or_same` `between` |

Tip se izvodi iz spiska (`StringOperator = (typeof STRING_OPERATORS)[number]`), nikad obrnuto. Ko
doda operator u spisak, dobio ga je i u tipu i u meniju; ko ga napise bilo gde drugde, nema ga.

Uz spiskove idu `operatorLabel` (tekst u meniju) i `operatorIcon` (znak na dugmetu). Znak se racuna
iz kodne tacke kroz `String.fromCodePoint`, pa u izvoru ne stoje sami simboli — `src/` ostaje ASCII.

Ne nose svi operatori isti broj vrednosti, pa ta razlika ima ime:

| Tip | Nosi vrednosti | Provera |
|---|---|---|
| `RangeOperator` | `between` — dve | `isRange(op)` |
| `ListOperator` | `in` — koliko god | `isList(op)` |
| `SingleOperator` | sve ostalo — tacno jednu | |

### Kodeci

`common/pretraga/predicate.ts` od spiska pravi kodek:

| Kodek | Na zici |
|---|---|
| `ioStringPredicate` | `[op, tekst]` |
| `ioEnumPredicate(io)` | `[op, ...vrednosti]` — vise od jedne samo uz `in` |
| `ioNumberPredicate` | `[op, broj]`, uz `between` `broj~broj` |
| `ioDatePredicate` | `[op, YYYY-MM-DD]`, uz `between` `datum~datum` |

Brojcani kodek jedini proverava i vrednost, ne samo operator: `?x=gte&x=abc` nije broj, pa nema
rutu. Datumski to ne radi — neispravan datum prodje kroz kodek, a `DateFilter.fromCriteria` ga vrati
kao prazno polje.

### Suzenje je brava, a brava je 404

Svaki kodek ima varijantu koja prima svoj spisak: `ioStringPredicateOf(operatori)`,
`ioEnumPredicateOf(io, operatori)`, `ioNumberPredicateOf(operatori)`.

```ts
export const OZNAKA_OPERATORI: ReadonlyArray<StringOperator> = ['contains', 'starts_with']

export const ioVoziloCriteria = Schema.Struct({
  registarskaOznaka: Schema.optional(ioStringPredicateOf(OZNAKA_OPERATORI)),
  ...
})
```

Odatle sledi da `?registarskaOznaka=neq&registarskaOznaka=BG` **nema rutu**. Ne ignorise se, ne
salje se pa server odbije — ekran se ne otvara, isto kao kad u adresi stoji `stanje=MARKO`. Ruta
kaze sta ekran ume; sve van toga nije predvidjeno koriscenje.

**Spisak dolazi iz projektne dokumentacije.** PJ kaze sta ruta razmenjuje; to se prepise ovde jednom
i filter ga samo procita (`TextFilter.vForm(OZNAKA_OPERATORI)`). Kad se kod i PJ razidju, PJ je u
pravu.

**Ovo nije zastita backend-a.** Dok server prima sve operatore koje tip ima, ko hoce da ga optereti
ne treba mu nasa aplikacija. Suzenje je ugovor ekrana: ono sto ekran nudi i ono sto adresa prima je
ista lista, pa korisnik ne moze da dospe u stanje koje niko nije projektovao.

### Sta jeste a sta nije predikat odlucuje zica

Ne vidzet. Dva polja koja u fioci izgledaju isto — oba su combo — na zici su razlicite stvari:

| Polje u filteru | Na zici | Zasto |
|---|---|---|
| `vrstaGoriva` | `vrstaGorivaID: ioId` | server ima sifarnik, salje se identifikator |
| `markaVozila` | `markaVozila: ioStringPredicate` | marka nema identifikator, ide tekst |
| `dostavljaMesecnuKm` | `ioBoolean` | da/ne nema sta da bira |

Combo koji salje `ioId` nema operator i nece ga dobiti. Combo koji salje predikat moze da ga dobije
kad ga PJ zatrazi; za sada koristi samo `eq`:

```ts
markaVozila: eq(value.markaVozila?.marka ?? null),
```

Zato `eq` i `contains` ostaju u `predicate.ts` i posle uvodjenja filter modula — `contains` koristi
i sam combo kad pretrazuje svoju listu (`unetaVrednost`).

Datumsko polje nema meni nego operator bira samo, prema tome koji je kraj popunjen; zato se ne
proverava da je "od" pre "do". Vidi [06 Pretraga](06-pretraga.md#filter).

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
