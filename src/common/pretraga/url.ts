import type { AnyCriteria, Predicate, Sort, SortDirection } from '../platform'

// -------------------------------------------------------------------------------------
// Стање листе у адресној линији
// -------------------------------------------------------------------------------------
//
// URL је извор истине: сортирање, померај и критеријуми живе у query параметрима, па
// освежавање странице, дељење линка и дугме „назад" раде без иједне додатне линије.
//
// Сорт иде као ЈЕДАН параметар:
//
//   ?sort=stanje:asc,datumOtpremnice:desc
//
// Затечени пројекти уписују два паралелна низа (`sortColumn` и `sortDirection`) која се
// спајају по индексу — а непаран низ се тамо тихо одбацује. Са једним параметром та класа
// грешака не постоји.

export const SORT_PARAM = 'sort'
export const OFFSET_PARAM = 'offset'

const smerUTekst = (smer: SortDirection): string => smer.toLowerCase()

const smerIzTeksta = (tekst: string): SortDirection | undefined =>
  tekst === 'asc' ? 'ASC' : tekst === 'desc' ? 'DESC' : undefined

export const sortUTekst = <O extends string>(sort: ReadonlyArray<Sort<O>>): string =>
  sort.map(([kolona, smer]) => `${kolona}:${smerUTekst(smer)}`).join(',')

/**
 * Неисправан део се одбацује, али само он — остатак сорта преживљава. Ручно дотеран URL
 * тако не обара екран, а не претвара се ни у погрешан редослед.
 */
export const sortIzTeksta = <O extends string>(tekst: string | undefined, dozvoljene: ReadonlyArray<O>): Sort<O>[] => {
  if (!tekst) return []
  const izlaz: Sort<O>[] = []
  for (const deo of tekst.split(',')) {
    const [kolona, smer] = deo.split(':')
    const proveren = smerIzTeksta((smer ?? '').trim())
    if (proveren === undefined) continue
    const imeKolone = kolona.trim() as O
    if (!dozvoljene.includes(imeKolone)) continue
    izlaz.push([imeKolone, proveren])
  }
  return izlaz
}

// -------------------------------------------------------------------------------------
// Критеријуми
// -------------------------------------------------------------------------------------

/** Н-торка (оператор + вредност) се уписује као поновљен кључ, исто као на жици. */
export const kriterijumiUQuery = (params: URLSearchParams, criteria: AnyCriteria): void => {
  for (const [kljuc, vrednost] of Object.entries(criteria)) {
    if (vrednost == null || vrednost === '') continue
    if (Array.isArray(vrednost)) {
      if (vrednost.length === 0) continue
      vrednost.forEach(v => params.append(kljuc, String(v)))
    } else {
      params.append(kljuc, String(vrednost))
    }
  }
}

/** Све осим `sort` и `offset` је критеријум. Поновљени кључ се враћа као н-торка. */
export const kriterijumiIzQuery = (params: URLSearchParams): AnyCriteria => {
  const criteria: Record<string, Predicate> = {}
  for (const kljuc of new Set(params.keys())) {
    if (kljuc === SORT_PARAM || kljuc === OFFSET_PARAM) continue
    const vrednosti = params.getAll(kljuc)
    criteria[kljuc] = vrednosti.length === 1 ? vrednosti[0] : vrednosti
  }
  return criteria
}

// -------------------------------------------------------------------------------------
// Цело стање
// -------------------------------------------------------------------------------------

export type StanjeListe<O extends string = string> = {
  readonly criteria: AnyCriteria
  readonly sort: ReadonlyArray<Sort<O>>
  readonly offset: number
}

export const stanjeUQuery = <O extends string>(stanje: StanjeListe<O>): string => {
  const params = new URLSearchParams()
  kriterijumiUQuery(params, stanje.criteria)
  if (stanje.sort.length > 0) params.set(SORT_PARAM, sortUTekst(stanje.sort))
  if (stanje.offset > 0) params.set(OFFSET_PARAM, String(stanje.offset))
  return params.toString()
}

export const stanjeIzQuery = <O extends string>(
  query: string,
  dozvoljeneKolone: ReadonlyArray<O>,
  podrazumevaniSort: ReadonlyArray<Sort<O>> = [],
): StanjeListe<O> => {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
  const sort = sortIzTeksta(params.get(SORT_PARAM) ?? undefined, dozvoljeneKolone)
  const offset = Number(params.get(OFFSET_PARAM) ?? 0)
  return {
    criteria: kriterijumiIzQuery(params),
    // Празан URL значи „први улазак", па важи почетни сорт — који сме имати више колона.
    sort: params.has(SORT_PARAM) ? sort : podrazumevaniSort,
    offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
  }
}
