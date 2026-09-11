import { Option } from 'effect'
import { Button, Title1 } from '@fluentui/react-components'
import { ArrowClockwiseRegular, FilterRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Stack, Toolbar } from '../../common/components/layout'
import * as Filter from '../../common/filter'
import * as List from '../../common/pretraga'
import { PODRAZUMEVANI_LIMIT } from '../../common/pretraga'
import { S, t } from '../../common/strings'
import { putanja, routes } from '../../router/route'
import * as Api from '../api'
import type { ArtikalCriteria } from '../api'
import { stanjeColumnRender } from '../domain/artikal-stanje'
import * as Kreiranje from '../kreiranje'
import { filter as filterSpec } from './filter'
import type { Model } from './model'
import { Msg, filter, kreiranje, list } from './msg'
import type { Kolona, Red } from './msg'

export type { Model } from './model'
export type { Msg } from './msg'

// -------------------------------------------------------------------------------------
// Претрага артикала
// -------------------------------------------------------------------------------------
//
// URL је извор истине: критеријуми, сорт и померај стоје у адресној линији. Кад листа јави
// да се стање променило, овај екран уписује нов URL — рутер га поново диже, и листа креће
// из `init` са новим стањем. Освежавање странице и дугме „назад" тако раде без додатног
// кода.

export type Authorization = Kreiranje.Authorization

const SORTABILNE = Api.pretraziArtikal.kolone

const PODRAZUMEVANI_SORT: ReadonlyArray<List.Sort<Kolona>> = [['sifra', 'ASC']]

const kolone: ReadonlyArray<List.Kolona<Red, Kolona>> = [
  { kljuc: 'sifra', naziv: 'Шифра', sirina: 120 },
  { kljuc: 'naziv', naziv: 'Назив', sirina: 280 },
  { kljuc: 'skraceniNaziv', naziv: 'Скраћени назив', sirina: 180 },
  { kljuc: 'jedinicaMereOznaka', naziv: 'ЈМ', sirina: 70 },
  { kljuc: 'grupaArtiklaNaziv', naziv: 'Група', sirina: 180 },
  { kljuc: 'stanje', naziv: 'Стање', sirina: 120, prikaz: red => stanjeColumnRender(red.stanje) },
]

const konfiguracija: List.Konfiguracija<Red, Kolona, ArtikalCriteria> = {
  ruta: Api.pretraziArtikal,
  limit: PODRAZUMEVANI_LIMIT,
}

export const init = (search: string): [Model, Cmd.Cmd<Msg>] => {
  const stanje = List.stanjeIzQuery<Kolona>(search, SORTABILNE, PODRAZUMEVANI_SORT)
  const [listaModel, listaCmd] = List.init(konfiguracija, stanje)
  // Фиока се пуни из истих критеријума из којих је кренула и претрага, па отворен филтер
  // показује оно по чему листа заиста стоји.
  const [filterModel, filterCmd] = Filter.izKriterijuma(filterSpec, stanje.criteria)
  return [
    { list: listaModel, filter: filterModel, filterOtvoren: false, kreiranje: Option.none() },
    Cmd.batch([Cmd.map(list)(listaCmd), Cmd.map(filter)(filterCmd)]),
  ]
}

/** Ново стање листе уписано у адресну линију; одатле рутер поново диже екран. */
const upisiUrl = (model: Model): Cmd.Cmd<Msg> => {
  const osnova = putanja(routes.artikli, {})
  const query = List.stanjeUQuery(List.stanje(model.list))
  return Navigation.pushUrl(query === '' ? osnova : osnova + '?' + query)
}

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    List: ({ msg: listaMsg }): [Model, Cmd.Cmd<Msg>] => {
      const [listaModel, cmd, ishod] = List.update(konfiguracija, listaMsg, model.list)
      const sledeci: Model = { ...model, list: listaModel }
      switch (ishod._tag) {
        case 'Nastavi':
          return [sledeci, Cmd.map(list)(cmd)]
        case 'StanjePromenjeno':
          return [sledeci, upisiUrl(sledeci)]
        // Двоклик отвара преглед — једини екран у модулу који има своју адресу.
        case 'Otvoren':
          return [sledeci, Navigation.pushUrl(putanja(routes.artikal, { artikalID: ishod.red.id }))]
      }
    },

    Filter: ({ msg: filterMsg }): [Model, Cmd.Cmd<Msg>] => {
      const [filterModel, cmd] = filterSpec.forma.update(filterMsg, model.filter)
      return [{ ...model, filter: filterModel }, Cmd.map(filter)(cmd)]
    },

    ShowFilter: ({ otvoren }): [Model, Cmd.Cmd<Msg>] => [{ ...model, filterOtvoren: otvoren }, Cmd.none],

    // Претрага иде кроз листу: она подиже `StanjePromenjeno`, а нов URL пише овај екран.
    ApplyFilter: (): [Model, Cmd.Cmd<Msg>] =>
      update(list(List.primeniKriterijume(Filter.uKriterijume(filterSpec, model.filter))), {
        ...model,
        filterOtvoren: false,
      }),

    ClearFilter: (): [Model, Cmd.Cmd<Msg>] => {
      const [prazan, cmd] = filterSpec.forma.create()
      const [sledeci, listaCmd] = update(list(List.primeniKriterijume({})), { ...model, filter: prazan })
      return [sledeci, Cmd.batch([listaCmd, Cmd.map(filter)(cmd)])]
    },

    StartKreiranje: (): [Model, Cmd.Cmd<Msg>] => {
      const [kreiranjeModel, cmd] = Kreiranje.init()
      return [{ ...model, kreiranje: Option.some(kreiranjeModel) }, Cmd.map(kreiranje)(cmd)]
    },

    // Пресавиј исход: снимљен артикал затвара дијалог и освежава листу.
    Kreiranje: ({ msg: kreiranjeMsg }): [Model, Cmd.Cmd<Msg>] =>
      Option.match(model.kreiranje, {
        onNone: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],
        onSome: (kreiranjeModel): [Model, Cmd.Cmd<Msg>] => {
          const [sledeci, cmd, ishod] = Kreiranje.update(kreiranjeMsg, kreiranjeModel)
          return Kreiranje.Outcome.$match(ishod, {
            Active: (): [Model, Cmd.Cmd<Msg>] => [
              { ...model, kreiranje: Option.some(sledeci) },
              Cmd.map(kreiranje)(cmd),
            ],
            Success: (): [Model, Cmd.Cmd<Msg>] => {
              const [listaModel, listaCmd] = List.update(konfiguracija, List.osvezi<Red, Kolona>(), model.list)
              return [{ ...model, kreiranje: Option.none(), list: listaModel }, Cmd.map(list)(listaCmd)]
            },
            Cancel: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, kreiranje: Option.none() }, Cmd.none],
          })
        },
      }),
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

export const view =
  (auth: Authorization, model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PretragaView auth={auth} model={model} dispatch={dispatch} />

const PretragaView = ({
  auth,
  model,
  dispatch,
}: {
  readonly auth: Authorization
  readonly model: Model
  readonly dispatch: Platform.Dispatch<Msg>
}) => {
  const naListu = (msg: List.Msg<Red, Kolona>) => dispatch(list(msg))

  return (
    <Stack vertical gap="m">
      <Stack align="center" justify="between">
        <Title1>{t(S.artikal.naslov)}</Title1>
        <Toolbar>
          <Button
            appearance="subtle"
            icon={<FilterRegular />}
            aria-label={t(S.filter.otvori)}
            onClick={() => dispatch(Msg.ShowFilter({ otvoren: true }))}
          />
          <Button
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            aria-label={t(S.lista.osvezi)}
            onClick={() => naListu(List.osvezi())}
          />
          {Kreiranje.button(auth, Msg.StartKreiranje(), dispatch)}
        </Toolbar>
      </Stack>

      <List.Tabela<Red, Kolona>
        model={model.list}
        kolone={kolone}
        sortabilne={SORTABILNE}
        kljuc={red => red.id}
        onSortiraj={kolona => naListu(List.sortiraj(kolona))}
        onIzaberi={red => naListu(List.izaberi(red))}
        onOtvori={red => naListu(List.otvori(red))}
      />

      <List.Paginacija
        offset={model.list.offset}
        limit={PODRAZUMEVANI_LIMIT}
        ukupno={List.ukupno(model.list.podaci)}
        onStrana={offset => naListu(List.promeniStranu(offset))}
      />

      <Filter.Fioka
        spec={filterSpec}
        model={model.filter}
        otvorena={model.filterOtvoren}
        dispatch={msg => dispatch(filter(msg))}
        onPretrazi={() => dispatch(Msg.ApplyFilter())}
        onOcisti={() => dispatch(Msg.ClearFilter())}
        onZatvori={() => dispatch(Msg.ShowFilter({ otvoren: false }))}
      />

      {Option.isSome(model.kreiranje) && Html.map(kreiranje)(Kreiranje.view(model.kreiranje.value))(dispatch)}
    </Stack>
  )
}
