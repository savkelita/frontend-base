import { Subtitle2, makeStyles, tokens } from '@fluentui/react-components'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as List from '../../common/pretraga'
import { PODRAZUMEVANI_LIMIT } from '../../common/pretraga'
import { S, t } from '../../common/strings'
import * as Api from '../api'
import type { ArtikalPakovanjeCriteria } from '../api'
import type { Kolona, Msg, Red } from './msg'

export type { Msg, Red, Kolona } from './msg'

// -------------------------------------------------------------------------------------
// Паковања артикла — листа унутар прегледа
// -------------------------------------------------------------------------------------
//
// Иста `List` као на самосталном екрану, али без URL-а: стање угнежђене листе не улази у
// адресну линију. Из истог разлога овај модул не враћа исход домаћину — једини исход који
// би имао смисла (`StanjePromenjeno`) овде не постоји.

export type Model = List.Model<Red, Kolona>

const SORTABILNE = Api.pretraziArtikalPakovanje.kolone
const PODRAZUMEVANI_SORT: ReadonlyArray<List.Sort<Kolona>> = [['pakovanjeNaziv', 'ASC']]

const kolone: ReadonlyArray<List.Kolona<Red, Kolona>> = [
  { kljuc: 'pakovanjeNaziv', naziv: 'Паковање', sirina: 260 },
  { kljuc: 'kolicina', naziv: 'Количина', sirina: 120 },
  { kljuc: 'jedinicaMereOznaka', naziv: 'ЈМ', sirina: 80 },
]

const konfiguracija = (artikalID: number): List.Konfiguracija<Red, Kolona, ArtikalPakovanjeCriteria> => ({
  ruta: zahtev => Api.pretraziArtikalPakovanje({ ...zahtev, criteria: { ...zahtev.criteria, artikalID } }),
  limit: PODRAZUMEVANI_LIMIT,
})

export const init = (artikalID: number): [Model, Cmd.Cmd<Msg>] =>
  List.init(konfiguracija(artikalID), { criteria: {}, sort: PODRAZUMEVANI_SORT, offset: 0 })

export const update = (artikalID: number, msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] => {
  const [sledeci, cmd] = List.update(konfiguracija(artikalID), msg, model)
  return [sledeci, cmd]
}

const useStyles = makeStyles({
  okvir: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
})

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PakovanjaView model={model} dispatch={dispatch} />

const PakovanjaView = ({ model, dispatch }: { readonly model: Model; readonly dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()
  return (
    <div className={styles.okvir}>
      <Subtitle2>{t(S.artikal.pakovanja)}</Subtitle2>
      <List.Tabela<Red, Kolona>
        model={model}
        kolone={kolone}
        sortabilne={SORTABILNE}
        kljuc={red => red.id}
        onSortiraj={kolona => dispatch(List.sortiraj(kolona))}
        onIzaberi={red => dispatch(List.izaberi(red))}
        // Двоклик на паковање нема куда — екран паковања још не постоји.
        onOtvori={red => dispatch(List.izaberi(red))}
      />
      <List.Paginacija
        offset={model.offset}
        limit={PODRAZUMEVANI_LIMIT}
        ukupno={List.ukupno(model.podaci)}
        onStrana={offset => dispatch(List.promeniStranu(offset))}
      />
    </div>
  )
}
