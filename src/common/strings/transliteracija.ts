// -------------------------------------------------------------------------------------
// Ćirilica -> latinica
// -------------------------------------------------------------------------------------
//
// Smer je namerno ovakav. Ćirilica u latinicu je jednoznačna: свако слово има тачно један
// латинични парњак. Обрнуто није — `nj` је обично `њ`, али „nadživeti" је `надживети`, а не
// `наџивети`, па би тај смер тражио речник изузетака који се никад не заврши.
//
// Зато извор текста стоји ћирилицом, а латиница се изводи овом функцијом.

const PAROVI: ReadonlyArray<readonly [string, string]> = [
  ['Љ', 'Lj'],
  ['Њ', 'Nj'],
  ['Џ', 'Dž'],
  ['љ', 'lj'],
  ['њ', 'nj'],
  ['џ', 'dž'],
  ['А', 'A'],
  ['Б', 'B'],
  ['В', 'V'],
  ['Г', 'G'],
  ['Д', 'D'],
  ['Ђ', 'Đ'],
  ['Е', 'E'],
  ['Ж', 'Ž'],
  ['З', 'Z'],
  ['И', 'I'],
  ['Ј', 'J'],
  ['К', 'K'],
  ['Л', 'L'],
  ['М', 'M'],
  ['Н', 'N'],
  ['О', 'O'],
  ['П', 'P'],
  ['Р', 'R'],
  ['С', 'S'],
  ['Т', 'T'],
  ['Ћ', 'Ć'],
  ['У', 'U'],
  ['Ф', 'F'],
  ['Х', 'H'],
  ['Ц', 'C'],
  ['Ч', 'Č'],
  ['Ш', 'Š'],
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['ђ', 'đ'],
  ['е', 'e'],
  ['ж', 'ž'],
  ['з', 'z'],
  ['и', 'i'],
  ['ј', 'j'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['ћ', 'ć'],
  ['у', 'u'],
  ['ф', 'f'],
  ['х', 'h'],
  ['ц', 'c'],
  ['ч', 'č'],
  ['ш', 'š'],
]

const MAPA = new Map(PAROVI)

/**
 * Велика слова дигафа испред великог слова дају оба велика: `ЉУБАВ` -> `LJUBAV`, а не
 * `LjUBAV`. Зато се дигаф гледа заједно са словом које следи.
 */
const jeVeliko = (znak: string | undefined): boolean =>
  znak !== undefined && znak === znak.toUpperCase() && znak !== znak.toLowerCase()

export const uLatinicu = (tekst: string): string => {
  let izlaz = ''
  for (let i = 0; i < tekst.length; i++) {
    const znak = tekst[i]
    const zamena = MAPA.get(znak)
    if (zamena === undefined) {
      izlaz += znak
      continue
    }
    if (zamena.length === 2 && jeVeliko(znak) && jeVeliko(tekst[i + 1])) {
      izlaz += zamena.toUpperCase()
      continue
    }
    izlaz += zamena
  }
  return izlaz
}
