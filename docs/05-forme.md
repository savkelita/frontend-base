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
  submitDisabled={!izmenjeno}
  dirty={!sameForm(EMPTY, model.value)}
  onSubmit={() => dispatch(submitted())}
  onClose={() => dispatch(closed())}
>
```

**`ConfirmDialog`** — potvrda, koristi se za brisanje.

### `dirty`

`dirty` ukljucuje dve zastite: `UnloadGuard` (potvrda pri zatvaranju kartice) i potvrdu pri
zatvaranju dijaloga. Racuna se poredjenjem sa polaznom vrednoscu preko `Equivalence`:

```ts
export const sameForm: Equivalence.Equivalence<FormValue> = Equivalence.struct({
  ime: Equivalence.strict<Name.Form>(),
  kategorije: Equivalence.mapInput(Equivalence.array(Equivalence.number), ids),
})
```

Kod kreiranja se poredi sa `EMPTY`, kod azuriranja sa `toForm(model.original)`.

Redosled visestrukog izbora nije izmena — zato `ids` sortira pre poredjenja.

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
