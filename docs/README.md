# Dokumentacija

Ovo je uputstvo za rad na `frontend-base` i na svakoj aplikaciji koja iz njega nastane.

Projekat nije skup nezavisnih ekrana nego jedan obrazac primenjen vise puta. Ako novi ekran ne lici
na postojeci, ili je zahtev zaista drugaciji, ili je nesto propusteno. Pre nego sto se napravi nova
apstrakcija, procita se kako je resen isti problem na `vozacima` i `vozilima`.

## Redosled citanja

| Dokument | O cemu je |
|---|---|
| [01 Arhitektura](01-arhitektura.md) | TEA petlja, `Cmd`, ugnjezdavanje modula, sta sme u `update` |
| [02 Struktura](02-struktura.md) | Gde sta zivi, imenovanje, barel fajlovi |
| [03 API sloj](03-api.md) | Konvencija backend-a, predikati, greske |
| [04 Domenski tipovi](04-domen.md) | `common/domain`, ugovor domenskog modula, enum i combo |
| [05 Forme](05-forme.md) | `effect-form`, validacija, dijalozi, dirty |
| [06 Pretraga](06-pretraga.md) | Anatomija ekrana pretrage i filtera |
| [07 Rute i autorizacija](07-rute-i-autorizacija.md) | Kako se dodaje ruta i funkcionalnost |
| [08 Testiranje](08-testiranje.md) | Sta se testira i kako |
| [09 Konvencije](09-konvencije.md) | Stil koda, commit-ovi, paketi |
| [10 Recepti](10-recepti.md) | Korak-po-korak za svaki cest zadatak |

## Referentni primeri u kodu

Kada dokumentacija i kod ne budu isto, kod je u pravu. Ovo su fajlovi na koje se dokumentacija
poziva:

| Slucaj upotrebe | Gde |
|---|---|
| Pretraga sa CRUD dijalozima | `src/sifarnici/vozac/pretraga/` |
| Pretraga sa bogatim filterom (datumi, kaskada) | `src/evidencija-vozila/vozilo/pretraga/` |
| Kreiranje | `src/sifarnici/vozac/kreiranje/` |
| Azuriranje (ucitava pa menja) | `src/sifarnici/vozac/azuriranje/` |
| Brisanje (potvrda) | `src/sifarnici/vozac/brisanje/` |
| API oblasti | `src/sifarnici/api/` |
| Domen oblasti | `src/sifarnici/domain/` |
