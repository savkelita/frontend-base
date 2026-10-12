import { Button } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { mapHttpError } from '../../../../common/error'
import { memoize } from '../../../../common/memo'
import {
  Data,
  initial,
  isLoading,
  next,
  sameRequest,
  toOrder,
  type Sort,
  type PretragaRequest,
} from '../../../../common/pretraga'
import { PretragaSection } from '../../../../common/pretraga/components/layout'
import { Paging } from '../../../../common/pretraga/components/paging'
import { Table, type Column } from '../../../../common/pretraga/components/table'
import * as Api from '../../../../evidencija-vozila/api'
import type { Vozilo, VoziloCriteria, VoziloOrder } from '../../../../evidencija-vozila/api'
import * as VoziloStanje from '../../../../evidencija-vozila/domain/vozilo-stanje'
import * as Filter from './filter'
import { LIMIT, type Model } from './model'
import { Msg, failed, filterMsg, loaded, pageChanged, retry, selectionChanged, sorted } from './msg'

export type { Model }
export type { Msg }

const toRequest = (model: Model): PretragaRequest<VoziloCriteria, VoziloOrder> => ({
  criteria: { ...model.criteria, vozacID: model.vozacID },
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

export const init = (vozacID: number): [Model, Cmd.Cmd<Msg>] => {
  const model: Model = {
    vozacID,
    offset: 0,
    sort: null,
    criteria: {},
    data: initial<Vozilo>(),
    selected: [],
    filterModel: Filter.init({}),
  }
  return [model, load(model)]
}

const reload = (model: Model): [Model, Cmd.Cmd<Msg>] => {
  const sledeci: Model = { ...model, data: next(model.data) }
  return [sledeci, load(sledeci)]
}

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Loaded: ({ request, page }): [Model, Cmd.Cmd<Msg>] =>
      sameRequest(toRequest(model), request) ? [{ ...model, data: Data.Ready({ page }) }, Cmd.none] : [model, Cmd.none],

    Failed: ({ request, error }): [Model, Cmd.Cmd<Msg>] =>
      sameRequest(toRequest(model), request)
        ? [{ ...model, data: Data.Failed({ error }) }, Cmd.none]
        : [model, Cmd.none],

    Sorted: ({ sort }): [Model, Cmd.Cmd<Msg>] => reload({ ...model, offset: 0, sort, selected: [] }),

    PageChanged: ({ offset }): [Model, Cmd.Cmd<Msg>] => reload({ ...model, offset, selected: [] }),

    SelectionChanged: ({ rows }): [Model, Cmd.Cmd<Msg>] =>
      isLoading(model.data) ? [model, Cmd.none] : [{ ...model, selected: rows }, Cmd.none],

    Retry: (): [Model, Cmd.Cmd<Msg>] => reload(model),

    FilterMsg: ({ msg: msgFilter }): [Model, Cmd.Cmd<Msg>] => {
      const filterModel = Filter.update(msgFilter, model.filterModel)
      if (msgFilter._tag !== 'Submitted') return [{ ...model, filterModel }, Cmd.none]
      return reload({
        ...model,
        filterModel,
        offset: 0,
        selected: [],
        criteria: Filter.toCriteria(filterModel.value),
      })
    },
  })

const rowId = (vozilo: Vozilo): number => vozilo.id

const dispatchers = memoize((dispatch: Platform.Dispatch<Msg>) => ({
  selectRow: (rows: ReadonlyArray<Vozilo>) => dispatch(selectionChanged(rows)),
  retryLoad: () => dispatch(retry()),
  changeSort: (sort: Sort<VoziloOrder>) => dispatch(sorted(sort)),
  changeOffset: (offset: number) => dispatch(pageChanged(offset)),
}))

const columns: ReadonlyArray<Column<Vozilo, VoziloOrder>> = [
  {
    id: 'registarskaOznaka',
    header: 'Registarska oznaka',
    attribute: 'registarskaOznaka',
    render: vozilo => vozilo.registarskaOznaka,
  },
  { id: 'markaVozila', header: 'Marka', attribute: 'markaVozila', render: vozilo => vozilo.markaVozila },
  { id: 'modelVozila', header: 'Model', attribute: 'modelVozila', render: vozilo => vozilo.modelVozila },
  { id: 'stanje', header: 'Stanje', attribute: 'stanje', render: vozilo => VoziloStanje.text(vozilo.stanje) },
]

const VozilaView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const { selectRow, retryLoad, changeSort, changeOffset } = dispatchers(dispatch)

  return (
    <PretragaSection
      title="Vozila vozaca"
      filter={Html.map(filterMsg)(Filter.view(model.filterModel))(dispatch)}
      actions={
        <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={retryLoad}>
          Osvezi
        </Button>
      }
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
  (dispatch: Platform.Dispatch<Msg>) => <VozilaView model={model} dispatch={dispatch} />
