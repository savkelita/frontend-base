# Recepti

Svaki recept polazi od postojeceg primera. Kopiraj ga i menjaj — cilj je da novi ekran lici na
stari, a ne da bude bolji na svoj nacin.

---

## Novi ekran pretrage

Uzor: `src/sifarnici/vozac/pretraga/`

### 1. API

`src/<oblast>/api/types.ts`:

```ts
export const Stavka = Schema.Struct({ id: Schema.Number, version: Schema.Number, naziv: Schema.String, audit: Audit })
export type Stavka = typeof Stavka.Type

export const ioStavkaOrder = Schema.Literal('naziv', 'stanje')
export type StavkaOrder = typeof ioStavkaOrder.Type

export type StavkaCriteria = {
  readonly naziv?: StringPredicate
  readonly stanje?: EnumPredicate<Stanje.Value>
}
```

`src/<oblast>/api/routes.ts`:

```ts
export const pretraziStavka = (
  request: PretragaRequest<StavkaCriteria, StavkaOrder>,
): Http.Request<PretragaResponse<Stavka>> =>
  get(withQuery('/api/oblast/pretraziStavka', request), Http.expectJson(ioPretragaResponse(Stavka)))
```

### 2. Filter

`pretraga/filter/model.ts` — `FormValue`, `vForm()` (sva polja `Schema.NullOr`), `Model` sa
`value`, `isOpen` i po jednim combo modelom za svaku listu.

`pretraga/filter/msg.ts` — `Changed`, `Submitted`, `Cleared`, `Toggled`, plus jedna poruka po combo
polju.

`pretraga/filter/index.tsx` — `EMPTY`, `ioState`/`toState`/`fromState`, `init`, `update`,
`toCriteria`, `options`, `fields`, pa na kraju:

```ts
export const view = (model: Model): TeaReact.Html<Msg> => filterView(model, fields, toggled, submitted, cleared)
export const button = (model: Model): TeaReact.Html<Msg> => filterButton(model.isOpen, toggled)
```

U `ioState` idu **samo combo vrednosti**. Tekst i enum se citaju iz adrese.

### 3. Ekran

`pretraga/model.ts` — `LIMIT` i `Model`.
`pretraga/msg.ts` — `Loaded`, `Failed`, `Sorted`, `PageChanged`, `SelectionChanged`, `Retry`,
`FilterMsg`.
`pretraga/index.tsx` — `RouteQuery`, `route`, `FUNKCIONALNOSTI`, `toRequest`, `load`, `goTo`,
`init`, `reload`, `update`, `columns`, `view`.

Ne zaboravi `sameRequest` u `Loaded` i `Failed`.

### 4. Router

Sest koraka iz [07 Rute i autorizacija](07-rute-i-autorizacija.md#dodavanje-rute).

### 5. Testovi

`test/update.test.ts`, `test/route.test.ts`. Ako ekran ima dugmad koja zavise od autorizacije, i
`test/view.test.ts`. Uz to dopuni `src/router/test/authorization.test.ts` — nova ruta sa pravom i
bez prava.

---

## Novo polje u filteru

**Tekst:**

```ts
// model.ts
naziv: Name.Form
// vForm()
naziv: Schema.NullOr(Name.vForm)
// index.tsx
naziv: predicateValue(criteria.naziv)     // init
naziv: contains(value.naziv)              // toCriteria
naziv: { label: 'Naziv' }                 // options.fields
{locals.inputs.naziv}                     // options.template
// pretraga/index.tsx
naziv: Schema.optional(ioStringPredicate) // RouteQuery
```

**Enum:** isto, ali `eq(value.stanje)` / `predicateValue`, i
`Schema.optional(ioEnumPredicate(Stanje.ioValue))` u ruti.

**Opseg datuma:**

```ts
datumOd: DateRange.Form                        // model.ts (tip je opseg, jedno polje)
datumOd: Schema.NullOr(DateRange.vForm)        // vForm()
datumOd: rangeValue(criteria.datumOd)          // init
datumOd: range(value.datumOd)                  // toCriteria
datumOd: Schema.optional(ioDatePredicate)      // RouteQuery
```

**Combo:** polje, poruka, combo model, `Combo.init` u `init`, grana u `update` sa `Combo.step`,
`ioValue` u `ioState`, `id` u `toCriteria`, `Combo.empty()` u `Cleared`.

Kad dodas polje, dodaj i njegov generator u `test/route.test.ts`.

---

## Novi CRUD dijalog

Uzori: `kreiranje/` (prazan obrazac), `azuriranje/` (ucitava pa menja), `brisanje/` (potvrda).

### Modul

```
kreiranje/
├── model.ts    FormValue, vForm(), Value, EMPTY, sameForm, Model
├── msg.ts      Changed, Submitted, Saved, SaveFailed, Closed, + combo poruke
└── index.tsx   FUNKCIONALNOSTI, button, init, toCmd, update, options, view
```

`button` sam proverava autorizaciju i vraca `null` bez nje:

```ts
export const button =
  <M,>(config: AuthorizationConfig, start: M): TeaReact.Html<M> =>
  (dispatch: Platform.Dispatch<M>) =>
    isAuthorized(config) ? <Button appearance="primary" icon={<AddRegular />} onClick={() => dispatch(start)}>Nova stavka</Button> : null
```

Modul ne zna sta se desava posle cuvanja. On javi `Saved` i tu mu je kraj.

### Ukljucivanje u ekran

`model.ts`:

```ts
readonly kreiranje: Option.Option<Kreiranje.Model>
```

`msg.ts`:

```ts
StartKreiranje: {}
KreiranjeMsg: { readonly msg: Kreiranje.Msg }
```

`update`:

```ts
StartKreiranje: () => {
  const [kreiranje, cmd] = Kreiranje.init
  return [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)]
},

KreiranjeMsg: ({ msg }) => {
  if (Option.isNone(model.kreiranje)) return [model, Cmd.none]
  if (msg._tag === 'Closed') return [{ ...model, kreiranje: Option.none() }, Cmd.none]
  if (msg._tag === 'Saved') {
    const [next, cmd] = reload({ ...model, kreiranje: Option.none() })
    return [next, Cmd.batch([cmd, Toast.success('Stavka je sacuvana.')])]
  }
  const [kreiranje, cmd] = Kreiranje.update(msg, model.kreiranje.value)
  return [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)]
},
```

`view`:

```tsx
actions={<>{Kreiranje.button(config, startKreiranje())(dispatch)}...</>}
...
{Option.isSome(model.kreiranje) && Html.map(kreiranjeMsg)(Kreiranje.view(model.kreiranje.value))(dispatch)}
```

Ekran mora da prima `config` u `view`, sto znaci da se i `screenView` u routeru menja:

```ts
VozaciScreen: ({ model }) => Html.map(vozaciMsg)(VozaciPretraga.view(config, model))(dispatch)
```

---

## Novi enum

```ts
// src/<oblast>/domain/<pojam>/index.ts
import * as Enum from '../../../common/domain/enum'

const KEYS = {
  KLJUC_SA_SERVERA: 'Tekst za korisnika',
  DRUGI_KLJUC: 'Drugi tekst',
}

export type Value = keyof typeof KEYS
export type Form = Enum.Form<Value>
export const ioValue = Enum.ioValue(KEYS)
export const vForm = Enum.vForm(KEYS)
export const text = (value: Value): string => KEYS[value]
```

Za visestruki izbor jos i `export const vFormMulti = Enum.vFormMulti(KEYS)`.

Za suzenu ponudu na pojedinim ekranima:

```ts
export const vForm = (dozvoljene: ReadonlyArray<Value>) => Enum.vForm(KEYS, dozvoljene)
```

---

## Novi combo

**1. Sema odgovora** u `api/types.ts`:

```ts
export const StavkaCombo = Schema.Struct({ id: Schema.Number, naziv: Schema.String })
export type StavkaCombo = typeof StavkaCombo.Type
```

**2. Ruta** u `api/routes.ts`:

```ts
export const pretraziStavkaCombo = (
  request: PretragaRequest<ComboCriteria, never>,
): Http.Request<PretragaResponse<StavkaCombo>> =>
  get(withQuery('/api/oblast/pretraziStavkaCombo', request), Http.expectJson(ioPretragaResponse(StavkaCombo)))
```

**3. Domenski modul** u `<oblast>/domain/<pojam>/index.ts`:

```ts
export type Value = Api.StavkaCombo
export type Form = Combo.Form<Value>
export const ioValue = Api.StavkaCombo
export const id = (s: Value): number => s.id
export const render = (s: Value): string => s.naziv
export const search = Api.pretraziStavkaCombo
export const vForm = Combo.vForm(ioValue, { id, render })
```

**4. Upotreba** u formi ili filteru — vidi "Novo polje u filteru".

Za zavisnu listu, `search` je funkcija roditeljske vrednosti i roditeljska grana u `update`-u prazni
dete kad se roditelj promeni.

---

## Novo domensko polje u `common/domain`

Samo ako pravilo vazi sire od jednog ekrana.

```
common/domain/<pojam>/
├── index.ts          export * from './form'   (+ './api' ako ima kodek)
├── form/index.tsx    Form, vForm
└── api/index.ts      ioValue, format, parse   (ako treba i van forme)
```

Ako je polje samo tekst sa drugom duzinom, dovoljno je:

```ts
export const MAX_LENGTH = 40
export type Form = Text.Form
export const vForm = Text.vForm(MAX_LENGTH)
```

Ako ima sopstveni widget, on ide u `common/domain/field/<ime>-field.tsx` i vezuje se anotacijom:

```ts
export const vForm = Schema.String.pipe(
  Schema.pattern(PATTERN),                       // pravilo prvo
  Annotation.template(mojeFieldPolje),           // widget
  Annotation.message((value: Form) => ...),      // tekst greske
)
```

Bez pravila, poruka nikad nece biti prikazana.

---

## Nova notifikacija

```ts
Toast.success('Stavka je sacuvana.')
Toast.failure('Neuspesno cuvanje.', { body: 'Pokusajte ponovo.' })
Toast.success('Stavka je sacuvana.', { action: { label: 'Otvori', msg: () => startAzuriranje(id) } })
```

`Toast` je `Cmd`, pa se kombinuje sa ostalim komandama kroz `Cmd.batch`. Dugme u notifikaciji salje
poruku nazad u `update` — nije `onClick` handler.

---

## Nova oblast

```
src/<oblast>/
├── api/
│   ├── index.ts     export * from './routes'; export * from './types'
│   ├── routes.ts
│   └── types.ts
├── domain/
└── <entitet>/
```

Zatim prvi ekran po receptu iznad. Stavka menija se dodaje u `src/navigation/config.ts`; ako oblast
ima vise ekrana, koristi se `navigationGroup`, koja se sama sakriva ako joj se sva deca sakriju.
