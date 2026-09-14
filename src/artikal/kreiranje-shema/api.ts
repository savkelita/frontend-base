import * as Http from 'tea-effect/Http'
import * as Combo from '../../common/shema/domain/combo'
import { ioPretragaResponse, withQuery } from '../../common/shema/pretraga'
import { sBaseComboResult } from '../../common/platform'
import type { BaseComboResult } from '../../common/platform'

// -------------------------------------------------------------------------------------
// Руте за поређење
// -------------------------------------------------------------------------------------
//
// Овде се види прва разлика која нема везе са формама: њихов combo чита `response.result` и
// `response.total_` — дакле **Java облик жице, директно**. Не постоји профил између, па би
// исти combo према .NET рути враћао празну листу без иједне грешке.
//
// Зато овде рута иде кроз њихов `withQuery` / `ioPretragaResponse`, а не кроз наш `makeApi`.

export type JedinicaMere = BaseComboResult

const combo =
  (operacija: string): Combo.Source<JedinicaMere> =>
  request =>
    Http.get(withQuery(`/api/sifarnik/${operacija}`, request), Http.expectJson(ioPretragaResponse(sBaseComboResult)))

export const pretraziJedinicaMereCombo = combo('pretraziJedinicaMereCombo')

export const pretraziGrupaArtiklaCombo = combo('pretraziGrupaArtiklaCombo')

/** Combo тражи и како да прочита идентитет и како да исцрта ред. */
export const renderCombo = {
  id: (item: JedinicaMere) => item.id,
  render: (item: JedinicaMere) => `${item.sifra} - ${item.naziv}`,
}
