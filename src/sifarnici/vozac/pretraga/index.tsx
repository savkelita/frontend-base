import { Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Router from 'tea-effect/Router'
import type { AuthorizationConfig, Funkcionalnost } from '../../../auth/types'
import { AuditCell } from '../../../common/audit/view'
import { mapHttpError } from '../../../common/error'
import { memoize } from '../../../common/memo'
import {
  Data,
  initial,
  ioDirection,
  ioEnumPredicate,
  ioStringPredicate,
  isLoading,
  next,
  sameRequest,
  toOrder,
  type PretragaRequest,
  type Sort,
} from '../../../common/pretraga'
import { PretragaLayout } from '../../../common/pretraga/components/layout'
import { Paging } from '../../../common/pretraga/components/paging'
import { Table, type Column } from '../../../common/pretraga/components/table'
import * as Api from '../../api'
import type { Vozac, VozacCriteria, VozacOrder } from '../../api'
import * as StanjeVozaca from '../../domain/stanje-vozaca'
import * as Azuriranje from '../azuriranje'
import * as Brisanje from '../brisanje'
import * as Kreiranje from '../kreiranje'
import * as Filter from './filter'
import { LIMIT, type Model } from './model'
import {
  Msg,
  azuriranjeMsg,
  brisanjeMsg,
  failed,
  filterMsg,
  kreiranjeMsg,
  loaded,
  pageChanged,
  retry,
  selectionChanged,
  sorted,
  startAzuriranje,
  startBrisanje,
  startKreiranje,
} from './msg'

export type { Model }
export type { Msg }

const RouteQuery = Schema.Struct({
  offset: Schema.optional(Router.IntFromString),
  order: Schema.optional(Api.ioVozacOrder),
  dir: Schema.optional(ioDirection),
  ime: Schema.optional(ioStringPredicate),
  prezime: Schema.optional(ioStringPredicate),
  imeZaPrikaz: Schema.optional(ioStringPredicate),
  email: Schema.optional(ioStringPredicate),
  telefon: Schema.optional(ioStringPredicate),
  kategorijaID: Schema.optional(Router.IntFromString),
  stanje: Schema.optional(ioEnumPredicate(StanjeVozaca.ioValue)),
})

export const route = Router.path('/sifarnici/vozaci').query(RouteQuery)

export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozaca']

const toRequest = (model: Model): PretragaRequest<VozacCriteria, VozacOrder> => ({
  criteria: model.criteria,
  order_: toOrder(model.sort),
  limit_: LIMIT,
  offset_: model.offset,
})

const state = (model: Model): Filter.State => Filter.toState(model.filterModel.value)

const load = (model: Model): Cmd.Cmd<Msg> => {
  const request = toRequest(model)
  return Http.send(Api.pretraziVozac(request), {
    onSuccess: response => loaded(request, { rows: response.result, total: response.total_ }),
    onError: error => failed(request, mapHttpError(error)),
  })
}

const goTo = (
  offset: number,
  sort: Sort<VozacOrder> | null,
  criteria: VozacCriteria,
  state: Filter.State,
): Cmd.Cmd<Msg> =>
  Navigation.pushUrl(
    Router.format(route, {
      ...criteria,
      ...(offset === 0 ? {} : { offset }),
      ...(sort === null ? {} : { order: sort.attribute, dir: sort.direction }),
    }),
    state,
  )

export const init = (query: typeof RouteQuery.Type, state: unknown, previous?: Model): [Model, Cmd.Cmd<Msg>] => {
  const { offset, order, dir, ...criteria } = query
  const [filterModel, filterCmd] = Filter.init(criteria, state, previous?.filterModel)
  const model: Model = {
    offset: offset ?? 0,
    sort: order === undefined ? null : { attribute: order, direction: dir ?? 'ASC' },
    criteria,
    data: previous === undefined ? initial<Vozac>() : next(previous.data),
    selected: [],
    filterModel,
    kreiranje: Option.none(),
    azuriranje: Option.none(),
    brisanje: Option.none(),
  }
  return [model, Cmd.batch([load(model), Cmd.map(filterMsg)(filterCmd)])]
}

const reload = (model: Model): [Model, Cmd.Cmd<Msg>] => [{ ...model, data: next(model.data) }, load(model)]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Loaded: ({ request, page }): [Model, Cmd.Cmd<Msg>] =>
      sameRequest(toRequest(model), request) ? [{ ...model, data: Data.Ready({ page }) }, Cmd.none] : [model, Cmd.none],

    Failed: ({ request, error }): [Model, Cmd.Cmd<Msg>] =>
      sameRequest(toRequest(model), request)
        ? [{ ...model, data: Data.Failed({ error }) }, Cmd.none]
        : [model, Cmd.none],

    Sorted: ({ sort }): [Model, Cmd.Cmd<Msg>] => [model, goTo(0, sort, model.criteria, state(model))],

    PageChanged: ({ offset }): [Model, Cmd.Cmd<Msg>] => [model, goTo(offset, model.sort, model.criteria, state(model))],

    SelectionChanged: ({ rows }): [Model, Cmd.Cmd<Msg>] =>
      isLoading(model.data) ? [model, Cmd.none] : [{ ...model, selected: rows }, Cmd.none],

    Retry: (): [Model, Cmd.Cmd<Msg>] => reload(model),

    StartKreiranje: (): [Model, Cmd.Cmd<Msg>] => {
      const [kreiranje, cmd] = Kreiranje.init
      return [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)]
    },

    KreiranjeMsg: ({ msg: msgKreiranje }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.kreiranje)) return [model, Cmd.none]
      if (msgKreiranje._tag === 'Closed') return [{ ...model, kreiranje: Option.none() }, Cmd.none]
      if (msgKreiranje._tag === 'Saved') return reload({ ...model, kreiranje: Option.none() })
      const [kreiranje, cmd] = Kreiranje.update(msgKreiranje, model.kreiranje.value)
      return [{ ...model, kreiranje: Option.some(kreiranje) }, Cmd.map(kreiranjeMsg)(cmd)]
    },

    StartAzuriranje: ({ id }): [Model, Cmd.Cmd<Msg>] => {
      const [azuriranje, cmd] = Azuriranje.init(id)
      return [{ ...model, azuriranje: Option.some(azuriranje) }, Cmd.map(azuriranjeMsg)(cmd)]
    },

    AzuriranjeMsg: ({ msg: msgAzuriranje }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.azuriranje)) return [model, Cmd.none]
      if (msgAzuriranje._tag === 'Closed') return [{ ...model, azuriranje: Option.none() }, Cmd.none]
      if (msgAzuriranje._tag === 'Saved') return reload({ ...model, azuriranje: Option.none(), selected: [] })
      const [azuriranje, cmd] = Azuriranje.update(msgAzuriranje, model.azuriranje.value)
      return [{ ...model, azuriranje: Option.some(azuriranje) }, Cmd.map(azuriranjeMsg)(cmd)]
    },

    StartBrisanje: ({ vozac }): [Model, Cmd.Cmd<Msg>] => {
      const [brisanje, cmd] = Brisanje.init(vozac)
      return [{ ...model, brisanje: Option.some(brisanje) }, Cmd.map(brisanjeMsg)(cmd)]
    },

    BrisanjeMsg: ({ msg: msgBrisanje }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.brisanje)) return [model, Cmd.none]
      if (msgBrisanje._tag === 'Closed') return [{ ...model, brisanje: Option.none() }, Cmd.none]
      if (msgBrisanje._tag === 'Deleted') return reload({ ...model, brisanje: Option.none(), selected: [] })
      const [brisanje, cmd] = Brisanje.update(msgBrisanje, model.brisanje.value)
      return [{ ...model, brisanje: Option.some(brisanje) }, Cmd.map(brisanjeMsg)(cmd)]
    },

    FilterMsg: ({ msg: msgFilter }): [Model, Cmd.Cmd<Msg>] => {
      const [filterModel, filterCmd] = Filter.update(msgFilter, model.filterModel)
      const cmd = Cmd.map(filterMsg)(filterCmd)
      return msgFilter._tag === 'Submitted'
        ? [
            { ...model, filterModel },
            Cmd.batch([
              cmd,
              goTo(0, model.sort, Filter.toCriteria(filterModel.value), Filter.toState(filterModel.value)),
            ]),
          ]
        : [{ ...model, filterModel }, cmd]
    },
  })

const rowId = (vozac: Vozac): number => vozac.id

const getSelectedRow = (model: Model): Vozac | undefined =>
  model.selected.length === 1 ? model.selected[0] : undefined

const dispatchers = memoize((dispatch: Platform.Dispatch<Msg>) => ({
  selectRow: (rows: ReadonlyArray<Vozac>) => dispatch(selectionChanged(rows)),
  retryLoad: () => dispatch(retry()),
  changeSort: (sort: Sort<VozacOrder>) => dispatch(sorted(sort)),
  changeOffset: (offset: number) => dispatch(pageChanged(offset)),
}))

const columns: ReadonlyArray<Column<Vozac, VozacOrder>> = [
  { id: 'audit', header: '', width: 52, truncate: false, render: vozac => <AuditCell audit={vozac.audit} /> },
  { id: 'ime', header: 'Ime', attribute: 'ime', render: vozac => vozac.ime },
  { id: 'prezime', header: 'Prezime', attribute: 'prezime', render: vozac => vozac.prezime },
  { id: 'kategorije', header: 'Kategorije', render: vozac => vozac.kategorije.map(k => k.oznaka).join(', ') },
  { id: 'imeZaPrikaz', header: 'Ime za prikaz', attribute: 'imeZaPrikaz', render: vozac => vozac.imeZaPrikaz },
  { id: 'email', header: 'E-mail', attribute: 'email', render: vozac => vozac.email },
  { id: 'telefon', header: 'Telefon', attribute: 'telefon', render: vozac => vozac.telefon },
  { id: 'stanje', header: 'Stanje', attribute: 'stanje', render: vozac => StanjeVozaca.text(vozac.stanje) },
]

const PretragaVozacaView = ({
  config,
  model,
  dispatch,
}: {
  config: AuthorizationConfig
  model: Model
  dispatch: Platform.Dispatch<Msg>
}) => {
  const { selectRow, retryLoad, changeSort, changeOffset } = dispatchers(dispatch)
  const selectedRow = getSelectedRow(model)

  return (
    <>
      <PretragaLayout
        title="Vozaci"
        actions={
          <>
            {Kreiranje.button(config, startKreiranje())(dispatch)}
            {Azuriranje.button(config, startAzuriranje, selectedRow?.id)(dispatch)}
            {Brisanje.button(config, startBrisanje, selectedRow)(dispatch)}
            {Html.map(filterMsg)(Filter.button(model.filterModel))(dispatch)}
          </>
        }
        filter={Html.map(filterMsg)(Filter.view(model.filterModel))(dispatch)}
        table={
          <Table
            columns={columns}
            data={model.data}
            rowId={rowId}
            selected={model.selected}
            onSelect={selectRow}
            onRetry={retryLoad}
            sort={model.sort}
            onSort={changeSort}
          />
        }
        paging={<Paging data={model.data} offset={model.offset} limit={LIMIT} onOffset={changeOffset} />}
      />
      {Option.isSome(model.kreiranje) && Html.map(kreiranjeMsg)(Kreiranje.view(model.kreiranje.value))(dispatch)}
      {Option.isSome(model.azuriranje) && Html.map(azuriranjeMsg)(Azuriranje.view(model.azuriranje.value))(dispatch)}
      {Option.isSome(model.brisanje) && Html.map(brisanjeMsg)(Brisanje.view(model.brisanje.value))(dispatch)}
    </>
  )
}

export const view =
  (config: AuthorizationConfig, model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PretragaVozacaView config={config} model={model} dispatch={dispatch} />
