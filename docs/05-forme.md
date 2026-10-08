# Forme

Forme se prave preko [effect-form](https://www.npmjs.com/package/effect-form). Sema je istovremeno
opis podataka, pravila validacije i rasporeda polja — prikaz ne bira komponente.

## Tri tipa jedne forme

```ts
export type FormValue = {          // sta je u modelu dok korisnik kuca
  readonly ime: Name.Form          // string | null
  readonly email: Email.Form
  readonly kategorije: Kategorija.FormMulti
}

export const vForm = () =>         // pravila + widget-i
  Schema.Struct({
    ime: Name.vForm,
    email: Schema.NullOr(Email.vForm),
    kategorije: Kategorija.vFormMulti,
  })

export type Value = Schema.Schema.Type<ReturnType<typeof vForm>>   // sta izadje kad prodje validacija
```

`FormValue` je uvek "moze biti prazno". `Value` je uvek "provereno". Iz `Value` se pravi komanda za
server.

`vForm` je **funkcija**, ne konstanta, jer sema cesto zavisi od konteksta (dozvoljene uloge,
dozvoljeni datumi). Cak i kad ne zavisi, ostaje funkcija radi jednoobraznosti.

**Opciono polje je `Schema.NullOr(...)`.** To je jedini nacin da se kaze "sme da ostane prazno" —
`effect-form` iz toga izvodi i `required` oznaku na polju.

## Iscrtavanje

```ts
Form.render({
  schema: vForm(),
  value: model.value,
  onChange: value => dispatch(changed(value)),
  options: options(styles, model, dispatch),
  issues: Form.visibleIssues(vForm, model.value, model.showErrors),
  ctx: { disabled: model.isSubmitting },
})
```

`options` ima dva dela:

```ts
const options = (styles, model, dispatch): Form.Options<FormValue> => ({
  template: locals => (
    <div className={styles.fields}>
      <div className={styles.red}>
        <div className={styles.polje}>{locals.inputs.ime}</div>
        <div className={styles.polje}>{locals.inputs.prezime}</div>
      </div>
      {locals.inputs.kategorije}
    </div>
  ),
  fields: {
    ime: { label: 'Ime', autoFocus: true },
    email: { label: 'E-mail', type: 'email' },
    kategorije: {
      label: 'Kategorije',
      placeholder: 'Izaberite kategorije',
      model: model.kategorijeCombo,
      onMsg: (msg: Combo.Msg<Kategorija.Value>) => dispatch(kategorijeMsg(msg)),
    },
  },
})
```

- `template` je raspored. Svako polje se pojavljuje tacno jednom.
- `fields` je konfiguracija polja. Combo polje ovde dobija svoj model i kanal poruka.

## Validacija

```ts
Submitted: () => {
  if (model.isSubmitting) return [model, Cmd.none]
  const result = Form.validate(vForm, model.value)
  if (!result.isValid) return [{ ...model, showErrors: true }, Cmd.none]
  return [{ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, kreiraj(result.value)]
}
```

`showErrors` je `false` dok se ne pritisne dugme. Greske se ne prikazuju dok korisnik jos kuca.
`Form.visibleIssues` to postuje i vraca prazan niz dok je `showErrors` `false`.

### Poruka bez pravila ne postoji

`Annotation.message` **samo preimenuje gresku koju je sema vec proizvela**. Ako iza nje nema
`Schema.filter` / `Schema.pattern` / `Schema.minItems`, poruka se nikad nece prikazati.

```ts
export const vForm = Schema.String.pipe(
  Schema.pattern(PATTERN),                          // pravilo
  Annotation.template(telefonField),                // widget
  Annotation.message((value: Form) => { ... }),     // tekst greske
)
```

Ovo je najcesca tiha greska pri pisanju novog domena. Pravilo pre poruke, uvek.

## Dijalozi

`common/form/dialog.tsx` daje dve komponente.

**`FormDialog`** — obrazac sa `Sacuvaj` / `Odustani`:

```tsx
<FormDialog
  title="Kreiranje vozaca"
  submitLabel="Sacuvaj"
  isSubmitting={model.isSubmitting}
  submitDisabled={!isDirty(model)}
  dirty={isDirty(model)}
  onSubmit={() => dispatch(submitted())}
  onClose={() => dispatch(closed())}
>
```

**`ConfirmDialog`** — potvrda, koristi se za brisanje. `onCancel` pokriva i `Esc`, ne samo dugme
`Nazad`; dok je `isSubmitting`, `Esc` ne radi nista, kao i oba dugmeta.

### `UpdateResult` — kako dijalog javlja da je gotov

`update` dijaloga **ne vraca `[Model, Cmd]`** nego `UpdateResult`, iz `common/form/result.ts`:

```ts
export type UpdateResult<Model, Msg, A> = Tagged.TaggedEnum<{
  Active: { readonly model: Model; readonly cmd: Cmd.Cmd<Msg> }
  Cancelled: {}
  Done: { readonly value: A }
}>
```

Slucaj se zove `Cancelled`, ne `Closed`: zatvaranje je mehanika dijaloga, a ishod je da je korisnik
odustao. Usput se time i konstruktori razlikuju od poruka (`cancelled()` vs `closed()`), pa modul
moze da se uvozi imenovano, bez prostora imena.

Dete u potpisu kaze cime se zavrsava, pa `kreiranje` vraca `ObjekatIdentifikator`, `brisanje`
vraca `Vozac`, a `azuriranje` nema sta da vrati pa je `void`:

```ts
export type Result = UpdateResult<Model, Msg, ObjekatIdentifikator>

Saved: ({ identifikator }): Result => done(identifikator),
Closed: (): Result => cancelled(),
SaveFailed: ({ error }): Result => active({ ...model, error: Option.some(error) }),
```

Roditelj presavija i **ne pominje nijednu poruku deteta**:

```ts
KreiranjeMsg: ({ msg }): [Model, Cmd.Cmd<Msg>] => {
  if (Option.isNone(model.kreiranje)) return [model, Cmd.none]
  return matchResult(Kreiranje.update(msg, model.kreiranje.value), {
    Active: ({ model: kreiranje, cmd }) => [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)],
    Cancelled: () => [{ ...model, kreiranje: Option.none() }, Cmd.none],
    Done: ({ value: { id } }) => /* reload + toast */,
  })
},
```

**Zasto ovako.** Ranije je roditelj presretao po tagu (`if (msg._tag === 'Saved')`) pre nego sto
prosledi. Iz toga su sledile tri stvari: sest grana u decoj `update` funkciji se nikad nije
izvrsilo, roditelj je znao privatna imena detetovih poruka, i **nigde u tipu nije pisalo koje su
poruke terminalne** — nova takva poruka ne bi nista srusila, dijalog bi samo ostao otvoren. Sada
ruzi kompajliranje dok je ne obradis.

`UpdateResult` je **samo za decu sa zivotnim ciklusom**, dakle dijaloge. Ekrani i dalje vracaju
`[Model, Cmd]`.

U testu dijaloga ide lokalni pomocnik koji suzava na `Active`:

```ts
const aktivan = (result: Result) => {
  if (result._tag !== 'Active') throw new Error(`ocekivan Active, a stigao ${result._tag}`)
  return result
}
```

### `dirty`

Nesacuvane izmene se brane na dva mesta: potvrdom pri zatvaranju dijaloga i zadrzavanjem pri
zatvaranju kartice. Prvo racuna sam dijalog, drugo je pretplata rutera.

Model izlaze `isDirty`, poredjenjem sa polaznom vrednoscu preko `Equivalence`:

```ts
export const sameForm: Equivalence.Equivalence<FormValue> = Equivalence.struct({
  ime: Equivalence.strict<Name.Form>(),
  kategorije: Equivalence.mapInput(Equivalence.array(Equivalence.number), ids),
})

export const isDirty = (model: Model): boolean => !sameForm(EMPTY, model.value)
```

Kod kreiranja se poredi sa `EMPTY`, kod azuriranja sa `toForm(model.original)`.

Redosled visestrukog izbora nije izmena — zato `ids` sortira pre poredjenja.

#### Cuvar odlaska sa strane

`beforeunload` je **jedna stvar za celu aplikaciju**, pa je ne drzi dijalog nego ruter. Dete samo
odgovara na pitanje, roditelj slaze odgovore, ruter pali jednu pretplatu:

```ts
// ekran
export const isDirty = (model: Model): boolean =>
  Option.exists(model.kreiranje, Kreiranje.isDirty) || Option.exists(model.azuriranje, Azuriranje.isDirty)

// router/subscriptions
unloadGuard(screenIsDirty(model.screen))
```

`unloadGuard(true)` je `Sub.fromCallback` pod stalnim kljucem, `unloadGuard(false)` je `Sub.none`.
Runtime vodi pretplate po kljucu i pusta finalizer kad kljuc nestane, pa se `removeEventListener`
desi sam — nema `useEffect`-a i nema komponente u prikazu.

**Ne dizi `Sub` kroz stablo kad dete ne emituje nijednu poruku.** `Sub.map` nad takvim tokom je
ceremonija, a pretplata po dijalogu radi samo zato sto dele kljuc. Novi modul sa formom dopise
`isDirty` u svoj model i jedan red u `screenIsDirty` — to je sve.

### Dijalog nad dijalogom

Potvrda odustajanja se crta **unutar** `DialogSurface`-a forme, ne kao susedni modal. Dva modala kao
braca ostavljaju `aria-hidden` na donjem, pa nakon zatvaranja gornjeg polja ispod vise ne primaju
fokus. Unutrasnji dijalog mora sam da trazi zatamnjenje:

```tsx
<DialogSurface backdrop={{ appearance: 'dimmed' }}>
```

## Dva kanala poruka

```ts
export type Model = {
  readonly value: FormValue
  readonly showErrors: boolean
  readonly isSubmitting: boolean
  readonly error: Option.Option<ApiError>
}
```

`issues` iz `Form.visibleIssues` idu u formu, uz polja. `error` se crta ispod forme:

```tsx
{Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
```

Serverska greska se nikad ne pretvara u `Issue`. Vidi [03 API sloj](03-api.md#greske).

## Azuriranje ima tri stanja

Ekran koji prvo ucitava podatak nema `Model` kao zapis nego kao tagovani enum:

```ts
Model = Loading | Failed { error } | Ready { original, value, showErrors, isSubmitting, error, ... }
```

`original` se cuva da bi se znalo sta je izmenjeno i da bi `version` otisao nazad na server.
