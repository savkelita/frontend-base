# Pretraga

Ekran pretrage je najcesci ekran u aplikaciji i najvise je standardizovan.

## Jedno pravilo iznad svih

**Adresa je pretraga.** Svaka promena strane, sortiranja ili filtera je promena URL-a, a ne promena
modela. Model se zatim gradi iz nove adrese.

```
klik na kolonu -> Sorted -> Navigation.pushUrl(...) -> UrlChanged -> init(query, state, previous)
```

Posledice koje se dobijaju besplatno: nazad i napred rade, adresa se moze poslati kolegi, osvezavanje
stranice ne gubi pretragu, i ne postoji stanje koje se razislo sa adresom.

Zato u `update`-u ne postoji "primeni filter na model". Postoji samo `goTo`.

## Fajlovi

```
pretraga/
├── index.tsx        ruta, kriterijumi, ucitavanje, tabela, dijalozi
├── model.ts         Model + LIMIT
├── msg.ts           Msg
├── filter/
│   ├── index.tsx    init/update/toCriteria/toState/view
│   ├── model.ts     FormValue + vForm + Model
│   └── msg.ts       Msg
└── test/
```

## Redosled u `index.tsx`

Fajl nema natpise sekcija, pa redosled **jeste** organizacija. Isti je na svakom ekranu pretrage,
tako da se cita jednom:

| | Sta | Ko to zove |
|---|---|---|
| 1 | `RouteQuery`, `route`, `FUNKCIONALNOSTI` | ruter |
| 2 | `POCETNA_*` konstante, ako ekran ima podrazumevanu pretragu | `init` |
| 3 | `toRequest`, `load` | server |
| 4 | `state`, `goTo` | adresa |
| 5 | `init`, `reload`, `update` | petlja |
| 6 | `rowId` i pomocne za celije, `dispatchers`, `columns`, `<Ekran>View`, `view` | prikaz |

Prelom je izmedju 5 i 6: **iznad `update` nema nista iz Reacta, ispod nema nista iz TEA petlje.**
`export const view` je uvek poslednji.

Grane `update`-a idu redom kojim ih `msg.ts` deklarise: prvo sedam iz kostura
(`Loaded`, `Failed`, `Sorted`, `PageChanged`, `SelectionChanged`, `Retry`, `FilterMsg`), pa parovi
`StartX` / `XMsg` po jednom dijalogu. Kostur je tako doslovno isti tekst na svim ekranima i razlika
se vidi na prvi pogled.

## Ruta i upit

```ts
const RouteQuery = pretragaQuery(Api.ioVozacCriteria, Api.ioVozacOrder)

export const route = Router.path('/sifarnici/vozaci').query(RouteQuery)
export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozaca']
```

Ruta i lista potrebnih funkcionalnosti stoje **uz ekran**, ne u routeru. Router ih samo pokupi.

Upit se **ne pise rukom**. `pretragaQuery` uzima semu kriterijuma iz API sloja i dodaje `offset`,
`order` i `dir`:

```ts
export const pretragaQuery = <F extends Schema.Struct.Fields & { [K in keyof Paging]?: never }, O extends string>(
  criteria: Schema.Struct<F>,
  order: Schema.Schema<O, O>,
) =>
  Schema.Struct({
    offset: Schema.optional(Router.IntFromString),
    order: Schema.optional(order),
    dir: Schema.optional(ioDirection),
    ...criteria.fields,
  })
```

Novo polje se dodaje **samo u `ioVozacCriteria`** i adresa ga odmah zna. Kad su bila dva spiska,
zaborav na jednoj strani niko nije primecivao: `fromRouteQuery` vraca `Omit<Q, keyof Paging>`, a to
se uredno dodeljuje kriterijumu sa opcionim poljima u oba smera, pa kompajler cuti dok se polje na
svaku promenu strane tiho prazni.

`[K in keyof Paging]?: never` u potpisu znaci da kriterijum ne sme da se zove `offset`, `order` ili
`dir`. Bez toga bi pregazio paging, a adresa bi izgledala ispravno.

`offset`, `order` i `dir` su strana i sortiranje; sve ostalo su kriterijumi. `fromRouteQuery` to
razdvaja bez rucnog nabrajanja:

```ts
const { offset, sort, criteria } = fromRouteQuery(query)
```

a `toRouteQuery` sastavlja nazad, izostavljajuci prvu stranu i nezadato sortiranje da adresa ostane
citljiva:

```ts
Navigation.pushUrl(Router.format(route, toRouteQuery(offset, sort, criteria)), state)
```

## Model

```ts
export const LIMIT = 5

export type Model = {
  readonly offset: number
  readonly sort: Sort<VozacOrder> | null
  readonly criteria: VozacCriteria
  readonly data: Data<Vozac>
  readonly selected: ReadonlyArray<Vozac>
  readonly filterModel: Filter.Model
  readonly kreiranje: Option.Option<Kreiranje.Model>
  readonly azuriranje: Option.Option<Azuriranje.Model>
  readonly brisanje: Option.Option<Brisanje.Model>
}
```

`offset`, `sort` i `criteria` su ogledalo adrese. `Option.none()` znaci da dijalog nije otvoren.

### `Data<A>`

```ts
Data<A> = Loading { previous: Page<A> | null } | Ready { page } | Failed { error }
```

`Loading` nosi prethodnu stranu, pa tabela ne treperi tokom ponovnog ucitavanja. `next(data)`
prelazi u `Loading` cuvajuci ono sto je vec prikazano; `initial()` je prvo ucitavanje bez icega.

Pomocne: `rows`, `total`, `page`, `isLoading`.

## Ucitavanje i zakasneli odgovori

```ts
const toRequest = (model: Model): PretragaRequest<VozacCriteria, VozacOrder> => ({
  criteria: model.criteria,
  order_: toOrder(model.sort),
  limit_: LIMIT,
  offset_: model.offset,
})

const load = (model: Model): Cmd.Cmd<Msg> => {
  const request = toRequest(model)
  return Http.send(Api.pretraziVozac(request), {
    onSuccess: response => loaded(request, { rows: response.result, total: response.total_ }),
    onError: error => failed(request, mapHttpError(error)),
  })
}
```

Poruka nosi **zahtev koji ju je izazvao**. Pri prijemu se poredi sa onim sto model trenutno trazi:

```ts
Loaded: ({ request, page }) =>
  sameRequest(toRequest(model), request) ? [{ ...model, data: Data.Ready({ page }) }, Cmd.none] : [model, Cmd.none],
```

Bez toga bi sporiji stariji odgovor pregazio noviji. Ovo nije opciono ni na jednom ekranu.

## `update`

Sedam poruka cini kostur:

| Poruka | Sta radi |
|---|---|
| `Loaded` / `Failed` | Upisuju rezultat ako je `sameRequest` |
| `Sorted` | `goTo(0, sort, ...)` — sortiranje vraca na prvu stranu |
| `PageChanged` | `goTo(offset, ...)` |
| `SelectionChanged` | Ignorise se dok traje ucitavanje |
| `Retry` | `reload` |
| `FilterMsg` | Prosledjuje filteru; na `Submitted` dodatno `goTo(0, ...)` |

```ts
FilterMsg: ({ msg: msgFilter }) => {
  const [filterModel, filterCmd] = Filter.update(msgFilter, model.filterModel)
  const cmd = Cmd.map(filterMsg)(filterCmd)
  return msgFilter._tag === 'Submitted'
    ? [{ ...model, filterModel },
       Cmd.batch([cmd, goTo(0, model.sort, Filter.toCriteria(filterModel.value), Filter.toState(filterModel.value))])]
    : [{ ...model, filterModel }, cmd]
}
```

Filter nikad sam ne menja adresu. On javi `Submitted`, ekran odluci.

## Filter

Filter ima tri zadatka: da drzi vrednosti, da ih pretvori u kriterijume, i da ih vrati nazad kada se
ekran obnavlja iz adrese.

```ts
export const toCriteria = (value: FormValue): VozacCriteria => ({
  ime: contains(value.ime),
  kategorijaID: value.kategorija?.id,
  stanje: eq(value.stanje),
})
```

```ts
export const init = (criteria: VozacCriteria, state: unknown, previous?: Model): [Model, Cmd.Cmd<Msg>] => {
  const [kategorija, kategorijaCombo, comboCmd] = Combo.init(
    criteria.kategorijaID,
    [fromState(state)?.kategorija, previous?.value.kategorija],
    Kategorija.search,
  )
  return [{ value: { ime: predicateValue(criteria.ime), kategorija, ... }, isOpen: previous?.isOpen ?? true, kategorijaCombo },
          Cmd.map(kategorijaMsg)(comboCmd)]
}
```

`predicateValue` i `rangeValue` su obrnuti smer od `contains` / `eq` / `range`.

### Zasto `state`

Adresa nosi `kategorijaID`, ali ne i naziv kategorije. Da bi combo posle povratka `Nazad` prikazao
labelu a ne prazno polje, ceo izabrani objekat se salje uz `pushUrl` kao `history.state`:

```ts
export const ioState = Schema.Struct({ kategorija: Schema.NullOr(Kategorija.ioValue) })
export const toState = (value: FormValue): State => ({ kategorija: value.kategorija })
const fromState = stateValue(ioState)
```

`stateValue` dekodira `unknown` u `State | undefined` — `history.state` nije pouzdan izvor i sme da
bude bilo sta.

Tri izvora vrednosti, tim redom: `history.state`, prethodni model ekrana, pa server. `Combo.init`
proba prva dva i salje zahtev samo ako oba zakazu.

### Prikaz filtera

```ts
const fields = (model: Model, dispatch: Platform.Dispatch<Msg>) =>
  Form.render({ schema: vForm(), value: model.value, onChange: value => dispatch(changed(value)),
                options: options(model, dispatch), issues: [] })

export const view = (model: Model): TeaReact.Html<Msg> => filterView(model, fields, toggled, submitted, cleared)
export const button = (model: Model): TeaReact.Html<Msg> => filterButton(model.isOpen, toggled)
```

`issues` je uvek `[]`. **Filter se ne validira.** Prazno polje znaci "ne filtriraj po tome", a
besmislen upit vraca prazan rezultat — sto je tacan odgovor, ne greska.

Jedini izuzetak je obavezan kriterijum: polje bez kojeg se ne sme pretrazivati. Tada polje izlazi iz
`Schema.NullOr`, filter dobija `showErrors`, `issues` dolaze iz `Form.visibleIssues`, a gola adresa
prestaje da bude pretraga. Ceo postupak:
[10 Recepti — Obavezan kriterijum pretrage](10-recepti.md#obavezan-kriterijum-pretrage).

`filterView` daje fioku, dugmad `Pretrazi` / `Ponisti` i memoizaciju. `fields`, `toggled`,
`submitted` i `cleared` su konstante na nivou modula, pa poredjenje props-a staje na modelu filtera.

Polja stoje u pravom `<form>`-u, a `Pretrazi` je njegovo `type="submit"` dugme, vezano preko
`form={id}` jer stoji u podnozju fioke. Zato **Enter u polju pokrece pretragu** — to radi pregledac,
nema naseg rukovaoca tastaturom. Fluent-ove liste i datum vec zovu `preventDefault` na Enter, pa tamo
Enter bira stavku ili potvrdjuje datum i ne salje formu.

## Prikaz ekrana

```tsx
<PretragaLayout
  title="Vozaci"
  actions={<>{Kreiranje.button(...)}{Azuriranje.button(...)}{Brisanje.button(...)}{Filter.button(...)}</>}
  filter={Html.map(filterMsg)(Filter.view(model.filterModel))(dispatch)}
  table={<Table columns={columns} data={model.data} rowId={rowId} selected={model.selected}
                onSelect={selectRow} onRetry={retryLoad} sort={model.sort} onSort={changeSort} />}
  paging={<Paging data={model.data} offset={model.offset} limit={LIMIT} onOffset={changeOffset} />}
/>
```

Kolona sa `attribute` je sortirajuca; bez njega nije. `attribute` mora biti clan `Order` tipa, sto
znaci da kompajler ne dozvoljava sortiranje po necemu sto backend ne podrzava.

```ts
const columns: ReadonlyArray<Column<Vozac, VozacOrder>> = [
  { id: 'audit', header: '', width: 52, truncate: false, render: v => <AuditCell audit={v.audit} /> },
  { id: 'ime', header: 'Ime', attribute: 'ime', render: v => v.ime },
  { id: 'kategorije', header: 'Kategorije', render: v => v.kategorije.map(k => k.oznaka).join(', ') },
]
```

## Podrazumevana pretraga

Prazna adresa sme da znaci nesto drugo od "sve". Vozila na praznom URL-u traze samo aktivna:

```ts
const prazna = Object.keys(query).length === 0
const criteria = prazna ? POCETNA_KRITERIJUM : zadato
const sort = prazna ? POCETNI_SORT : sortIzAdrese
```

Cim korisnik nesto promeni, adresa vise nije prazna i podrazumevano vise ne vazi.

Ovo nije isto sto i obavezan kriterijum. Ovde prazna adresa jeste pretraga, samo suzena. Kod
obaveznog kriterijuma prazna adresa uopste nije pretraga.

## Ugnjezdena pretraga

Pravilo "adresa je pretraga" vazi za **ekran**. Lista koja zivi unutar nekog pregleda — vozila
jednog vozaca, zaduzenja jednog vozila — nije ekran i **ne sme da dira adresu**. Dva takva filtera
na istoj strani bi se otimala oko istog URL-a, a `Nazad` bi ponistavao suzavanje podliste umesto
da vrati korisnika odakle je dosao.

Granica je ovakva:

| | nosi ga |
|---|---|
| koji ekran gledas, nad cim | adresa |
| kako si suzio podlistu unutar njega | model |

Uzor: `src/sifarnici/vozac/pregled/vozila/`.

### Model je isti, menjaju se tri grane

```ts
export type Model = {
  readonly vozacID: number
  readonly offset: number
  readonly sort: Sort<VoziloOrder> | null
  readonly criteria: VoziloCriteria
  readonly data: Data<Vozilo>
  readonly selected: ReadonlyArray<Vozilo>
  readonly filterModel: Filter.Model
}
```

Isti kostur kao na ekranu, plus identifikator roditelja. Razlika je samo u tome ko pamti promenu:

```ts
// ekran                                   // ugnjezdeno
Sorted:      goTo(0, sort, …)              reload({ ...model, offset: 0, sort, selected: [] })
PageChanged: goTo(offset, …)               reload({ ...model, offset, selected: [] })
Submitted:   goTo(0, …, criteria)          reload({ ...model, offset: 0, criteria, selected: [] })
```

Nema `goTo`, nema `Navigation.pushUrl`, nema `fromRouteQuery`. Od celog `common/pretraga` jedino
`query.ts` zna za adresu; `Data`, `sameRequest`, predikati, `Table` i `Paging` koriste se
neizmenjeni.

`sameRequest` ostaje i ovde, i **vazniji je nego na ekranu**: tamo ruter na svaku promenu adrese
pravi nov model, a ovde isti model zivi kroz sve promene, pa zakasneli odgovor ima u sta da upadne.

### Roditelj se dodaje u zahtevu, ne u filteru

```ts
const toRequest = (model: Model): PretragaRequest<VoziloCriteria, VoziloOrder> => ({
  criteria: { ...model.criteria, vozacID: model.vozacID },
  order_: toOrder(model.sort),
  limit_: LIMIT,
  offset_: model.offset,
})
```

Korisnik ga ne menja, pa mu nije mesto medju poljima filtera. Posto ulazi u `criteria`, `sameRequest`
ga automatski poredi.

### Filter je traka, ne fioka

Fioka se izvlaci sa strane i ima `isOpen`; ugnjezdenom filteru to ne treba — uvek je vidljiv.

```ts
export const view = (model: Model): TeaReact.Html<Msg> => filterBar(model, fields, submitted, cleared)
```

`filterBar` rasporedjuje polja u red koji se prelama i sam dodaje `Pretrazi` / `Ponisti`. Ekran u
`options.template` samo nabraja polja, bez CSS-a.

Zato je i filter model manji: nema `isOpen`, nema `Toggled`, nema `ioState`/`toState`. Istorija
pregledaca ovu pretragu ne pamti, pa nema sta da se vraca iz `history.state`. `update` filtera vraca
go `Model`, ne par sa komandom — jedini razlog za komandu bi bio combo, a ako ga ima, vraca se par
kao i na ekranu.

### Raspored

```tsx
<PretragaSection
  title="Vozila vozaca"
  filter={Html.map(filterMsg)(Filter.view(model.filterModel))(dispatch)}
  actions={<Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={retryLoad}>Osvezi</Button>}
  table={<Table … />}
  paging={<Paging … />}
/>
```

`PretragaSection` je par za `PretragaLayout` sa istim propovima: `PretragaLayout` je ceo ekran,
`PretragaSection` je odeljak unutar njega. Tabela raste do dna, uz `minHeight` koji drzi prazno
stanje — ono se crta kroz apsolutno pozicioniran sloj, pa bez visine nema gde.

## Dijalozi nad pretragom

`kreiranje`, `azuriranje` i `brisanje` su zasebni moduli koje pretraga drzi u `Option`-u. Svaki od
njih izvozi `button(config, ...)` koji sam proverava autorizaciju i vraca `null` ako je nema.

```ts
KreiranjeMsg: ({ msg }) => {
  if (Option.isNone(model.kreiranje)) return [model, Cmd.none]
  if (msg._tag === 'Closed') return [{ ...model, kreiranje: Option.none() }, Cmd.none]
  if (msg._tag === 'Saved') {
    const [next, cmd] = reload({ ...model, kreiranje: Option.none() })
    return [next, Cmd.batch([cmd, Toast.success('Vozac je sacuvan.',
      { action: { label: 'Otvori', msg: () => startAzuriranje(msg.identifikator.id) } })])]
  }
  const [kreiranje, cmd] = Kreiranje.update(msg, model.kreiranje.value)
  return [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)]
}
```

Obrazac je uvek isti: prazan `Option` — ignorisi; `Closed` — zatvori; ishod (`Saved` / `Deleted`) —
zatvori, osvezi, javi; sve ostalo — prosledi.

## Sta jos nije generalizovano

Kostur ekrana (`toRequest`, `load`, `goTo`, `Loaded`, `Failed`, `Sorted`, `PageChanged`,
`FilterMsg`) ponavlja se izmedju ekrana i **namerno nije izvucen**. Dok postoje dve pretrage, zajednicki
skelet bi bio pogadjanje. Kada ih bude pet-sest i bude jasno gde se stvarno razilaze, onda se izvlaci.

Do tada: kopiraj postojeci ekran i menjaj, ne izmisljaj novi oblik.
