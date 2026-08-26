import { Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Router from 'tea-effect/Router'
import type { Funkcionalnost } from '../../../auth/types'
import { AuditCell } from '../../../common/audit/view'
import * as DateDomain from '../../../common/domain/date'
import { mapHttpError } from '../../../common/error'
import { memoize } from '../../../common/memo'
import {
  Data,
  initial,
  ioDatePredicate,
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
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../api'
import * as IstekRegistracije from '../../domain/istek-registracije'
import * as VoziloStanje from '../../domain/vozilo-stanje'
import * as Filter from './filter'
import { LIMIT, type Model } from './model'
import { Msg, failed, filterMsg, loaded, pageChanged, retry, selectionChanged, sorted } from './msg'

export type { Model }
export type { Msg }

const RouteQuery = Schema.Struct({
  offset: Schema.optional(Router.IntFromString),
  order: Schema.optional(Api.ioVoziloOrder),
  dir: Schema.optional(ioDirection),
  registarskaOznaka: Schema.optional(ioStringPredicate),
  markaVozila: Schema.optional(ioStringPredicate),
  modelVozila: Schema.optional(ioStringPredicate),
  vrstaGorivaID: Schema.optional(Router.IntFromString),
  vrstaVozilaID: Schema.optional(Router.IntFromString),
  korisnikVozilaID: Schema.optional(Router.IntFromString),
  vozacID: Schema.optional(Router.IntFromString),
  datumPrveRegistracije: Schema.optional(ioDatePredicate),
  datumIsticanjaRegistracije: Schema.optional(ioDatePredicate),
  dostavljaMesecnuKm: Schema.optional(Schema.BooleanFromString),
  stanje: Schema.optional(ioEnumPredicate(VoziloStanje.ioValue)),
  istekRegistracije: Schema.optional(ioEnumPredicate(IstekRegistracije.ioValue)),
})

export const route = Router.path('/evidencija-vozila/vozila').query(RouteQuery)

export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozila']

const POCETNA_KRITERIJUM: VoziloCriteria = { stanje: ['eq', 'AKTIVAN'] }

const POCETNI_SORT: Sort<VoziloOrder> = { attribute: 'registarskaOznaka', direction: 'ASC' }

const toRequest = (model: Model): PretragaRequest<VoziloCriteria, VoziloOrder> => ({
  criteria: model.criteria,
  order_: toOrder(model.sort),
  limit_: LIMIT,
  offset_: model.offset,
})

const load = (model: Model): Cmd.Cmd<Msg> => {
  const request = toRequest(model)
  return Http.send(Api.pretraziVozilo(request), {
    onSuccess: response => loaded(request, { rows: response.result, total: response.total_ }),
    onError: error => failed(request, mapHttpError(error)),
  })
}

const state = (model: Model): Filter.State => Filter.toState(model.filterModel.value)

const goTo = (
  offset: number,
  sort: Sort<VoziloOrder> | null,
  criteria: VoziloCriteria,
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
  const { offset, order, dir, ...zadato } = query
  const prazna = Object.keys(query).length === 0
  const criteria = prazna ? POCETNA_KRITERIJUM : zadato
  const [filterModel, filterCmd] = Filter.init(criteria, state, previous?.filterModel)
  const model: Model = {
    offset: offset ?? 0,
    sort: order === undefined ? (prazna ? POCETNI_SORT : null) : { attribute: order, direction: dir ?? 'ASC' },
    criteria,
    data: previous === undefined ? initial<Vozilo>() : next(previous.data),
    selected: [],
    filterModel,
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

const rowId = (vozilo: Vozilo): number => vozilo.id

const datum = (value: Date | null): string => (value === null ? '' : DateDomain.format(value))

const vozac = (vozilo: Vozilo): string =>
  vozilo.vozacIme === null && vozilo.vozacPrezime === null
    ? ''
    : [vozilo.vozacIme, vozilo.vozacPrezime].filter(deo => deo !== null).join(' ')

const dispatchers = memoize((dispatch: Platform.Dispatch<Msg>) => ({
  selectRow: (rows: ReadonlyArray<Vozilo>) => dispatch(selectionChanged(rows)),
  retryLoad: () => dispatch(retry()),
  changeSort: (sort: Sort<VoziloOrder>) => dispatch(sorted(sort)),
  changeOffset: (offset: number) => dispatch(pageChanged(offset)),
}))

const columns: ReadonlyArray<Column<Vozilo, VoziloOrder>> = [
  { id: 'audit', header: '', width: 52, truncate: false, render: vozilo => <AuditCell audit={vozilo.audit} /> },
  {
    id: 'registarskaOznaka',
    header: 'Registarska oznaka',
    attribute: 'registarskaOznaka',
    render: vozilo => vozilo.registarskaOznaka,
  },
  {
    id: 'datumIsticanjaRegistracije',
    header: 'Datum isticanja registracije',
    attribute: 'datumIsticanjaRegistracije',
    width: 200,
    render: vozilo => datum(vozilo.datumIsticanjaRegistracije),
  },
  {
    id: 'datumPrveRegistracije',
    header: 'Datum prve registracije',
    attribute: 'datumPrveRegistracije',
    width: 180,
    render: vozilo => datum(vozilo.datumPrveRegistracije),
  },
  { id: 'markaVozila', header: 'Marka vozila', attribute: 'markaVozila', render: vozilo => vozilo.markaVozila },
  { id: 'modelVozila', header: 'Model vozila', attribute: 'modelVozila', render: vozilo => vozilo.modelVozila },
  {
    id: 'vrstaGorivaNaziv',
    header: 'Vrsta goriva',
    attribute: 'vrstaGorivaNaziv',
    render: vozilo => vozilo.vrstaGorivaNaziv,
  },
  {
    id: 'vrstaVozilaNaziv',
    header: 'Vrsta vozila',
    attribute: 'vrstaVozilaNaziv',
    render: vozilo => vozilo.vrstaVozilaNaziv,
  },
  { id: 'vozac', header: 'Vozac', attribute: 'vozacPrezime', render: vozac },
  {
    id: 'korisnikVozilaNaziv',
    header: 'Korisnik vozila',
    attribute: 'korisnikVozilaNaziv',
    render: vozilo => vozilo.korisnikVozilaNaziv ?? '',
  },
  {
    id: 'dostavljaMesecnuKm',
    header: 'Dostavlja zavrsnu mesecnu km',
    attribute: 'dostavljaMesecnuKm',
    width: 140,
    render: vozilo => (vozilo.dostavljaMesecnuKm ? 'Da' : 'Ne'),
  },
  { id: 'napomena', header: 'Napomena', render: vozilo => vozilo.napomena ?? '' },
  { id: 'stanje', header: 'Stanje', attribute: 'stanje', render: vozilo => VoziloStanje.text(vozilo.stanje) },
]

const PretragaVozilaView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const { selectRow, retryLoad, changeSort, changeOffset } = dispatchers(dispatch)

  return (
    <PretragaLayout
      title="Vozila"
      actions={Html.map(filterMsg)(Filter.button(model.filterModel))(dispatch)}
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
  )
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PretragaVozilaView model={model} dispatch={dispatch} />
