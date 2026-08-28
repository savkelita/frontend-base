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

## Ruta i upit

```ts
const RouteQuery = Schema.Struct({
  offset: Schema.optional(Router.IntFromString),
  order: Schema.optional(Api.ioVozacOrder),
  dir: Schema.optional(ioDirection),
  ime: Schema.optional(ioStringPredicate),
  kategorijaID: Schema.optional(Router.IntFromString),
  stanje: Schema.optional(ioEnumPredicate(StanjeVozaca.ioValue)),
})

export const route = Router.path('/sifarnici/vozaci').query(RouteQuery)
export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozaca']
```

Ruta i lista potrebnih funkcionalnosti stoje **uz ekran**, ne u routeru. Router ih samo pokupi.

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
