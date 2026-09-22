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

export const ioStavkaCriteria = Schema.Struct({
  naziv: Schema.optional(ioStringPredicate),
  stanje: Schema.optional(ioEnumPredicate(Stanje.ioValue)),
})

export type StavkaCriteria = typeof ioStavkaCriteria.Type
```

Kriterijum je sema jer iz nje nastaje i `RouteQuery`. Kodeci su query-string kodeci: `ioId` za
identifikatore, `Schema.BooleanFromString` za `da/ne`.

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
`pretraga/index.tsx` — `route`, `FUNKCIONALNOSTI`, `toRequest`, `load`, `goTo`, `init`, `reload`,
`update`, `columns`, `view`. Upit se ne pise:

```ts
const RouteQuery = pretragaQuery(Api.ioStavkaCriteria, Api.ioStavkaOrder)
export const route = Router.path('/oblast/stavke').query(RouteQuery)
```

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
// api/types.ts
naziv: Schema.optional(ioStringPredicate) // ioStavkaCriteria
// filter/model.ts
naziv: Name.Form
// vForm()
naziv: Schema.NullOr(Name.vForm)
// filter/index.tsx
naziv: predicateValue(criteria.naziv)     // init
naziv: contains(value.naziv)              // toCriteria
naziv: { label: 'Naziv' }                 // options.fields
{locals.inputs.naziv}                     // options.template
```

**Enum:** isto, ali `Schema.optional(ioEnumPredicate(Stanje.ioValue))` u kriterijumu i
`eq(value.stanje)` / `predicateValue`.

**Opseg datuma:**

```ts
datumOd: Schema.optional(ioDatePredicate)      // ioStavkaCriteria
datumOd: DateRange.Form                        // filter/model.ts (tip je opseg, jedno polje)
datumOd: Schema.NullOr(DateRange.vForm)        // vForm()
datumOd: rangeValue(criteria.datumOd)          // init
datumOd: range(value.datumOd)                  // toCriteria
```

Ruta se ne dira ni u jednom slucaju — `pretragaQuery` polje pokupi iz kriterijuma.

**Combo:** polje, poruka, combo model, `Combo.init` u `init`, grana u `update` sa `Combo.step`,
`ioValue` u `ioState`, `id` u `toCriteria`, `Combo.empty()` u `Cleared`.

Kad dodas polje, dodaj i njegov generator u `test/route.test.ts`.

---

## Obavezan kriterijum pretrage

Podrazumevano nijedan kriterijum nije obavezan — prazno polje znaci "ne filtriraj po tome". Kad
zahtev kaze da se bez nekog podatka ne sme pretrazivati, prvo se odlucuje koja je to od dve stvari.

**A. Ima podrazumevanu vrednost.** Polje uvek nesto nosi, korisnik ga samo menja. Nema novog stanja
ekrana:

```ts
stanje: StanjeVozaca.vForm,                        // vForm(), bez NullOr
const EMPTY: FormValue = { ..., stanje: 'AKTIVAN' }
```

Prazna adresa je i dalje pretraga; vidi
[Podrazumevana pretraga](06-pretraga.md#podrazumevana-pretraga). `Ponisti` vraca na podrazumevano,
ne na prazno.

**B. Nema je.** Korisnik mora sam da unese podatak koji aplikacija ne moze da pogodi. Tada gola
adresa **prestaje da bude pretraga**, a ekran dobija stanje "jos nije pretrazeno". Ostatak recepta je
o tom slucaju, na primeru obaveznog `ime` na vozacima.

### 1. Polje gubi `NullOr`

```ts
// filter/model.ts
export const vForm = () =>
  Schema.Struct({
    ime: Name.vForm,
    prezime: Schema.NullOr(Name.vForm),
    ...
  })

export type Value = Schema.Schema.Type<ReturnType<typeof vForm>>
```

`FormValue.ime` ostaje `Name.Form`, dakle i dalje sme `null`. Nacrt je sirok, sema je uska. Poruka
"Podatak je obavezan" vec postoji u `Text.vForm` i `Combo.vForm` — ne dopisuje se.

### 2. Filter pamti da je pretraga zatrazena

```ts
// filter/model.ts
export type Model = {
  readonly value: FormValue
  readonly showErrors: boolean
  readonly isOpen: boolean
  readonly kategorijaCombo: Combo.Model<Kategorija.Value>
}
```

```ts
// filter/index.tsx
Submitted: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, showErrors: true }, Cmd.none],
Cleared: (): [Model, Cmd.Cmd<Msg>] => [
  { ...model, value: EMPTY, showErrors: false, kategorijaCombo: Combo.empty() },
  Cmd.none,
],
```

```ts
issues: Form.visibleIssues(vForm, model.value, model.showErrors),
```

Do prvog `Pretrazi` nema crvenog — korisniku se ne vice pre nego sto je pokusao. Posle njega greske
prate kucanje.

### 3. Filter izdaje kriterijum samo kad je ispravan

```ts
export const toCriteria = (value: Value): VozacCriteria => ({
  ime: contains(value.ime),
  prezime: contains(value.prezime),
  ...
})

export const criteria = (model: Model): Option.Option<VozacCriteria> => {
  const result = Form.validate(vForm, model.value)
  return result.isValid ? Option.some(toCriteria(result.value)) : Option.none()
}
```

`toCriteria` sada prima `Value` (izlaz seme), ne `FormValue` (nacrt). To je jedina izmena koju
kompajler nece oprostiti, i zato je dobra: mesto gde ekran pokusa da napravi kriterijum od nacrta
odmah pukne.

### 4. Ekran zna da adresa ne mora biti pretraga

```ts
// filter/index.tsx
export const isSearch = (criteria: VozacCriteria): boolean => criteria.ime !== undefined
```

```ts
// pretraga/index.tsx
const load = (model: Model): Cmd.Cmd<Msg> => {
  if (!Filter.isSearch(model.criteria)) return Cmd.none
  const request = toRequest(model)
  return Http.send(Api.pretraziVozac(request), { ... })
}
```

```ts
FilterMsg: ({ msg: msgFilter }): [Model, Cmd.Cmd<Msg>] => {
  const [filterModel, filterCmd] = Filter.update(msgFilter, model.filterModel)
  const cmd = Cmd.map(filterMsg)(filterCmd)
  if (msgFilter._tag !== 'Submitted') return [{ ...model, filterModel }, cmd]
  return [
    { ...model, filterModel },
    Option.match(Filter.criteria(filterModel), {
      onNone: () => cmd,
      onSome: criteria => Cmd.batch([cmd, goTo(0, model.sort, criteria, Filter.toState(filterModel.value))]),
    }),
  ]
},
```

`toRequest`, `reload`, `Loaded`, `Failed`, `Sorted` i `PageChanged` ostaju **nepromenjeni**.

### 5. Umesto tabele stoji poziv

```tsx
const isSearch = Filter.isSearch(model.criteria)
```

```tsx
table={
  isSearch ? (
    <Table columns={columns} data={model.data} ... />
  ) : (
    <div className={styles.poziv}>
      <Text>Unesite ime da biste pokrenuli pretragu.</Text>
    </div>
  )
}
paging={isSearch ? <Paging data={model.data} offset={model.offset} limit={LIMIT} onOffset={changeOffset} /> : null}
```

Fioka je vec otvorena na dolasku, preko `isOpen: previous?.isOpen ?? true` u `Filter.init`.

### Kriterijum u API sloju ostaje `Schema.optional`

```ts
ime: Schema.optional(ioStringPredicate),   // ioVozacCriteria
```

Obavezno je **polje forme**, ne kriterijum. Iskusenje je da se `optional` skine i ovde, posto iz te
seme nastaje `RouteQuery`. Ne sme. `Router.format(routes.vozaci, {})` u `src/navigation/config.ts`
tada ne bi mogao da sastavi stavku menija, a `Router.parse` ne bi prepoznao `/sifarnici/vozaci`, pa
bi korisnik iz menija pao na 404.

Adresa bez kriterijuma je **ispravna adresa koja nije pretraga**. Zato se provera ne zove `isValid`.

### Dva pravila, ne jedno

| | ulaz | pravilo |
|---|---|---|
| fioka | nacrt (`FormValue`) | cela sema: `Trim`, `nonEmptyString`, `maxLength` |
| adresa | `VozacCriteria` | polje postoji |

Spajanje ne radi. Adresa nosi `kategorijaID: 3`, a nacrt trazi ceo objekat `{ id, oznaka }` koji tek
stize sa servera. Kad bi se `isSearch` oslanjao na `Form.validate`, ekran sa obaveznim comboom ne bi
pretrazivao dok combo ne odgovori.

Posledica koja se prihvata: rucno otkucan `?ime=contains&ime=` pokrece pretragu sa praznim imenom.
Kroz fioku se do toga ne moze doci, jer `Schema.Trim` + `nonEmptyString` zaustave razmake.

### Testovi

`filter/test/filter.test.ts`:

```ts
it('bez imena nema kriterijuma', () => {
  expect(Option.isNone(criteriaOf(form({})))).toBe(true)
})

it('slanje bez imena pali prikaz gresaka, ali ne dira polja', () => {
  const poslato = apply(submitted(), open())
  expect(poslato.showErrors).toBe(true)
  expect(poslato.value).toStrictEqual(open().value)
})

it('nijedna adresa bez imena nije pretraga', () => {
  expect(isSearch({ kategorijaID: 3 })).toBe(false)
  expect(isSearch({ ime: ['contains', 'Pera'] })).toBe(true)
})
```

`test/update.test.ts` — primena bez obaveznog polja ne sme da dodirne adresu:

```ts
it('primena bez imena ne menja adresu', async () => {
  const [, cmd] = update(filterMsg(Filter.submitted()), prazno())
  expect(await pushedUrls(cmd)).toStrictEqual([])
})
```

`test/view.test.ts` — sta korisnik vidi:

```ts
it('bez imena u adresi stoji poziv umesto tabele', () => {
  expect(draw(SVE)).toContain('Unesite ime da biste pokrenuli pretragu.')
})
```

Ne pisi test koji salje `Loaded` u model bez kriterijuma i ocekuje da bude odbijen. Ta poruka ne
moze da nastane — `load` vraca `Cmd.none`, a `Retry` postoji samo u tabeli koje tada nema. To je
odbrana od nepostojeceg stanja, pravilo 4.

### Najveci deo posla su testovi

Izvor je tri fajla i oko cetrdeset linija. Postojeci testovi su drugih tri fajla i vise izmena, jer
`open()` i `request()` u `test/update.test.ts` prave model iz adrese koja vise nije pretraga:

```ts
const IME: StringPredicate = ['contains', 'Pera']
const open = (query = {}): Model => init({ ime: IME, ...query }, undefined)[0]
const prazno = (query = {}): Model => init(query, undefined)[0]
```

Racunaj na to pri proceni.

### Kad ovo preraste oblik

Model i dalje drzi `data` u `Loading` dok pretraga nije zadata, a niko ga tada ne cita. Podnosljivo
je dok samo prikaz gleda `data`. Kad i `selected`, `offset` i `sort` pocnu da imaju smisla iskljucivo
u zadatom stanju, pretraga postaje tagovana:

```ts
export type Pretraga = Tagged.TaggedEnum<{
  Nezadata: {}
  Zadata: {
    readonly offset: number
    readonly sort: Sort<VozacOrder> | null
    readonly criteria: VozacCriteria
    readonly data: Data<Vozac>
    readonly selected: ReadonlyArray<Vozac>
  }
}>
```

Jedan ekran to ne opravdava (pravilo 10).

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
