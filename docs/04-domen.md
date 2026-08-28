# Domenski tipovi

Domenski modul je jedan pojam sa svim sto uz njega ide: tip vrednosti, kodek prema zici, sema za
formu (koja u sebi nosi i widget i validaciju) i prikaz.

Zahvaljujuci `effect-form`-u, polje se ne bira u prikazu. Polje je **anotacija na semi**, pa forma
zna kako da nacrta svako polje iz same seme.

## Ugovor

Ne mora svaki modul da ima sve, ali ono sto ima mora da se zove ovako:

| Ime | Tip | Znacenje |
|---|---|---|
| `Value` | tip | Vrednost kakvu server vidi |
| `Form` | tip | Ista stvar dok je u formi (obicno `Value \| null`) |
| `FormMulti` | tip | Visestruki izbor |
| `ioValue` | `Schema` | Kodek prema zici i prema adresi |
| `vForm` | `Schema` sa anotacijom | Sema za formu |
| `vFormMulti` | `Schema` sa anotacijom | Isto, visestruko |
| `text` | `(Value) => string` | Prikaz u tabeli |
| `render` | `(Value) => string` | Prikaz u combo listi |
| `id` | `(Value) => number \| string` | Kljuc stavke u combo listi |
| `search` | `Combo.Source<Value>` | Pretraga combo liste |

Ako nesto trenutno nije u upotrebi ali pripada standardu (npr. `text` kod enum-a), ostaje. Standard
je vredniji od uklonjenog mrtvog export-a.

## Katalog `common/domain`

| Modul | Za sta | Ogranicenje |
|---|---|---|
| `text` | Bilo koji tekst | `vForm(maxLength)` |
| `name` | Ime, naziv | 80 |
| `desc` | Opis, napomena | 255 |
| `code10` | Kratka sifra | 10 |
| `code30` | Duza sifra | 30 |
| `email` | E-posta | 80 + obrazac |
| `telefon` | Telefon | `3816` + 7-8 cifara |
| `number` | Broj | `vForm(decimals, maxIntegerDigits)` |
| `int` | Ceo broj | 0 decimala, 10 cifara |
| `decimal` | Decimalni broj | 2 decimale, 16 cifara |
| `boolean` | Da / Ne | |
| `date` | Datum | |
| `date-range` | Opseg datuma | dva polja, oba opciona |
| `date-time` | Datum i vreme | samo kodek (`api/`), nema polje |
| `enum` | Zatvorena lista | mehanizam, vidi nize |
| `combo` | Lista sa servera | mehanizam, vidi nize |

Duzine nisu izmisljene — dolaze iz backend-a. Ako polje na serveru ima drugu duzinu, koristi se
`Text.vForm(n)` direktno, ne pravi se novi modul zbog jednog polja.

### Kako izgleda modul iz kataloga

```ts
// common/domain/name/form/index.ts
import * as Text from '../../text'

export const MAX_LENGTH = 80
export type Form = Text.Form
export const vForm = Text.vForm(MAX_LENGTH)
```

Podela na `form/` i `api/` postoji da bi se kodek koristio i tamo gde nema React-a:
`common/pretraga/predicate.ts` uvozi `date/api` zbog `toYmd` / `fromYmd`, a ne sme da povuce Fluent
sa sobom.

## Enum

Enum je mapa `kljuc -> tekst`. Kljuc je ono sto ide na server, tekst ono sto korisnik vidi. Iz jedne
mape izvodi se sve ostalo:

```ts
import * as Enum from '../../../common/domain/enum'

const KEYS = {
  AKTIVAN: 'Aktivan',
  PASIVAN: 'Pasivan',
}

export type Value = keyof typeof KEYS
export type Form = Enum.Form<Value>
export const ioValue = Enum.ioValue(KEYS)
export const vForm = Enum.vForm(KEYS)
export const text = (stanje: Value): string => KEYS[stanje]
```

To je ceo modul. Nema odvojene liste izbora, nema `as const satisfies`, nema duplog nabrajanja.

`vForm(KEYS, only)` suzava ponudu u vreme izvrsavanja a ne menja tip — koristi se kada isti enum na
razlicitim ekranima nudi razlicit podskup:

```ts
export const vForm = (uloge: ReadonlyArray<Value>) => Enum.vForm(KEYS, uloge)
```

## Combo

Combo je padajuca lista koja se puni sa servera: pretraga po unetom tekstu (sa 300ms odlaganja),
dopuna na skrol, i pocetna vrednost po `id`-u.

Domenski modul za combo je uvek isti oblik:

```ts
import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.VrstaGorivaCombo
export type Form = Combo.Form<Value>
export const ioValue = Api.VrstaGorivaCombo
export const id = (vrsta: Value): number => vrsta.id
export const render = (vrsta: Value): string => vrsta.naziv
export const search = Api.pretraziVrstaGorivaCombo
export const vForm = Combo.vForm(ioValue, { id, render })
```

Ako lista nema `id` (npr. marka vozila je samo string), `id` vraca string i modul dodaje
`fromText`, jer se vrednost tada moze rekonstruisati iz kriterijuma bez odlaska na server.

Za zavisnu listu, `search` je funkcija koja prima roditelja:

```ts
export const search =
  (marka: string): Combo.Source<Value> =>
  request =>
    Api.pretraziModelVozilaCombo({ ...request, criteria: { ...request.criteria, marka: ['eq', marka] } })
```

### Combo u ekranu

Combo ima svoje stanje (`Combo.Model<A>`) odvojeno od izabrane vrednosti (koja zivi u
`model.value`). Dve funkcije spajaju to dvoje:

```ts
const [vrednost, combo, cmd] = Combo.init(criteria.vrstaGorivaID, [izStanja, izPrethodnog], search)
```

`Combo.init` gleda da li se objekat vec zna (iz `history.state`, ili iz prethodnog modela ekrana).
Ako zna, nema poziva servera. Ako ne zna a `id` postoji, salje jedan poziv da bi labela bila
ispravna.

```ts
const [vrednost, combo, cmd] = Combo.step(search, comboMessage, model.combo, model.value.vrstaGoriva)
```

`Combo.step` je `Combo.update` plus izvlacenje izabrane vrednosti iz poruka `Selected` i
`Initialized`. Bez njega bi svaki ekran ponavljao isto grananje po tagu.

Kaskada se resava u roditelju: kad se marka promeni, model se prazni.

```ts
return markaVozila?.marka === model.value.markaVozila?.marka
  ? [{ ...model, markaCombo }, cmd]
  : [{ ...model, markaCombo, modelCombo: Combo.empty(), value: { ...model.value, markaVozila, modelVozila: null } }, cmd]
```

## Kada se pravi novi domenski modul

Da:

- pojam ima **sopstveno pravilo** (telefon, e-posta, sifra od 10)
- pojam se pojavljuje na vise mesta
- pojam je zatvorena lista ili lista sa servera

Ne:

- polje jednog ekrana bez posebnog pravila — `Name.vForm` na licu mesta
- samo zato sto polje ima svoje ime; ime nije pravilo
