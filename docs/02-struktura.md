# Struktura projekta

## Mapa

```
src/
├── index.tsx               ulaz: FluentProvider + tea-effect program
├── router/                 orkestrator: rute, ekrani, sesija, layout
├── navigation/             levi meni
├── login/                  prijava
├── home/                   pocetna
├── auth/                   sesija, funkcionalnosti, uloge
│   ├── api/
│   ├── domain/uloga/
│   ├── istek-sesije/       otkucaj, upozorenje pred kraj, odjava
│   ├── session.ts
│   └── types.ts
├── common/                 sve sto deli vise oblasti
│   ├── audit/              Audit tip i celija u tabeli
│   ├── domain/             domenski tipovi i polja (vidi 04)
│   ├── env/                promenljive okruzenja
│   ├── error/              ApiError, prevod u poruku, prikaz
│   ├── form/               omotac oko effect-form + dijalozi
│   ├── http/               XSRF, get/post, ObjekatIdentifikator
│   ├── memo/               memoize po identitetu
│   ├── pretraga/           predikati, sortiranje, strane, komponente
│   ├── theme/              globalni stilovi
│   └── toast/              notifikacije
├── sifarnici/              oblast
│   ├── api/                routes.ts + types.ts
│   ├── domain/             domenski tipovi oblasti
│   └── vozac/              entitet
│       ├── pretraga/
│       ├── kreiranje/
│       ├── azuriranje/
│       └── brisanje/
└── evidencija-vozila/      oblast
```

## Pravila razmestaja

**Oblast → entitet → slucaj upotrebe.** `sifarnici/vozac/kreiranje`, ne `sifarnici/forms/VozacForm`.
Folder se zove po tome **sta radi**, ne po tehnickoj vrsti (`components`, `views`, `containers`,
`utils` ne postoje).

**Jedan `api/` po oblasti.** `oblast/api/routes.ts` su pozivi, `oblast/api/types.ts` su seme, a
`oblast/api/index.ts` je barel koji re-exportuje oba.

**Jedan `domain/` po oblasti.** Domenski tipovi koje koristi vise ekrana iste oblasti. Ako ih koristi
vise oblasti, sele se u `common/domain`.

**Testovi u `test/` pored modula.** `src/sifarnici/vozac/pretraga/test/update.test.ts`. Nikad
paralelno stablo `__tests__` u korenu.

**Barel fajl nema logiku.** `index.ts` koji sadrzi samo `export * from './form'` je u redu. Cim
barel pocne da racuna nesto, to nije barel nego modul kome fali ime.

## Imenovanje

| Prefiks / ime | Znacenje | Primer |
|---|---|---|
| `io` | Kodek prema zici — dekodira i kodira ono sto ide na server ili u adresu | `ioValue`, `ioStringPredicate`, `ioVozacOrder` |
| `v` | Sema za prikaz — nosi `Annotation.template` i validaciju forme | `vForm`, `vFormMulti` |
| `Value` | Tip domenske vrednosti onako kako je server vidi | `StanjeVozaca.Value` |
| `Form` | Tip iste stvari **dok je u formi**, obicno `Value \| null` | `StanjeVozaca.Form` |
| `Model` | Stanje modula | |
| `Msg` | Poruke modula | |

`Value` i `Form` nisu isti tip i ne smeju se izjednaciti. Polje u formi je prazno dok korisnik ne
unese vrednost; polje na zici nije.

Ostalo imenovanje:

- Domaci jezik, bez dijakritike: `Vozac`, `pretraziVozac`, `imeZaPrikaz`, `Sacuvaj`.
- Poruke u proslom vremenu (`Loaded`, `Saved`, `Cleared`), komande u imperativu (`kreiraj`,
  `azuriraj`, `obrisi`).
- Konstruktor poruke je `camelCase` verzija tag-a: `Msg.StartKreiranje` ↔ `startKreiranje`.
- Reci se ne izmisljaju. Ako isti pojam vec postoji u kodu, koristi se isto ime.

## Uvozi

ESLint namece redosled i abecedu (`import-x/order`), Prettier ostalo. Ne uredjuje se rucno —
`yarn fix-lint` i `yarn fix-prettier` to rade.

Tip se uvozi kao tip:

```ts
import type * as Platform from 'tea-effect/Platform'
import { Data, isLoading, type Sort } from '../../../common/pretraga'
```

Uvoz iz susedne oblasti ide preko njenog barela (`../../../sifarnici/domain/vozac`), nikad direktno
u njen unutrasnji fajl.

## Sta ide u `common/`

U `common/` ide ono sto je **ponovljivo i generalno**: mehanizam, ne konkretno polje.

- `common/domain/text` — svaki tekstualni podatak sa ogranicenom duzinom. Da.
- `common/domain/telefon` — pravilo koje vazi za ceo backend. Da.
- `registarskaOznaka` — polje jednog ekrana. Ne; to je `Text.vForm(...)` na licu mesta.

Kada se dvoumis: dok postoji jedan korisnik, ostaje na ekranu. Kada se pojavi drugi sa istim
pravilom, seli se.
