import { Data, Option } from 'effect'
import { Button, Title1 } from '@fluentui/react-components'
import { AddRegular, ArrowClockwiseRegular, FilterRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Stack, Toolbar } from '../../common/components/layout'
import * as Filter from '../../common/filter'
import { OPERATORI_BROJ, OPERATORI_TEKST, Polje } from '../../common/filter'
import type { FormModel, FormMsg } from '../../common/forms'
import * as Lista from '../../common/pretraga'
import { PODRAZUMEVANI_LIMIT } from '../../common/pretraga'
import { profiles } from '../../common/platform'
import { S, t } from '../../common/strings'
import { putanja as rutaPutanja, routes } from '../../router/route'
import * as Api from '../api'
import type { StavkaOtpremniceOrder, StavkaOtpremniceResult } from '../api'
import * as Create from './create'

// -------------------------------------------------------------------------------------
// Ставке отпремнице — листа са дијалогом за додавање
// -------------------------------------------------------------------------------------
//
// URL је извор истине: сорт, померај и критеријуми стоје у адресној линији. Кад листа јави
// да се стање променило, овај екран уписује нов URL — рутер га поново диже, и листа креће
// из init са новим стањем. Освежавање странице и дугме назад тако раде без додатног кода.

type Red = StavkaOtpremniceResult
type Kolona = StavkaOtpremniceOrder

const SORTABILNE = Api.pretraziStavkaOtpremnice.kolone
const PODRAZUMEVANI_SORT: ReadonlyArray<Lista.Sort<Kolona>> = [['redniBroj', 'ASC']]

const kolone: ReadonlyArray<Lista.Kolona<Red, Kolona>> = [
  { kljuc: 'redniBroj', naziv: 'Р. бр.', sirina: 70 },
  { kljuc: 'artikalSifra', naziv: 'Шифра', sirina: 110 },
  { kljuc: 'artikalNaziv', naziv: 'Артикал', sirina: 260 },
  { kljuc: 'pakovanjeNaziv', naziv: 'Паковање', sirina: 180 },
  { kljuc: 'kolicina', naziv: 'Количина', sirina: 110 },
  {
    kljuc: 'osnovnaKolicina',
    naziv: 'Основна количина',
    sirina: 160,
    prikaz: red =>
      red.osnovnaKolicina === null ? '' : String(red.osnovnaKolicina) + ' ' + red.osnovnaJedinicaMereOznaka,
  },
]

// Називи критеријума су они које рута већ прима — предикатска поља (`[оператор, вредност]`)
// смеју овде јер отпремница иде на Java профил.
const filterPolja = {
  redniBroj: Polje.brojPredikat({ label: 'Редни број', operatori: OPERATORI_BROJ, podrazumevani: 'eq' }),
  kolicina: Polje.brojPredikat({ label: 'Количина', operatori: OPERATORI_BROJ, podrazumevani: 'eq' }),
  serijskiBroj: Polje.tekstPredikat({
    label: 'Серијски број',
    operatori: OPERATORI_TEKST,
    podrazumevani: 'contains',
  }),
}

type FilterPolja = typeof filterPolja

const filterSpec = Filter.napraviFilter(profiles.java, filterPolja, field => (
  <>
    {field('redniBroj')}
    {field('kolicina')}
    {field('serijskiBroj')}
  </>
))

export type Msg = Data.TaggedEnum<{
  List: { readonly msg: Lista.Msg<Red, Kolona> }
  StartCreate: {}
  Create: { readonly msg: Create.Msg }
  Filter: { readonly msg: FormMsg<FilterPolja> }
  ShowFilter: { readonly otvoren: boolean }
  ApplyFilter: {}
  ClearFilter: {}
}>

export const Msg = Data.taggedEnum<Msg>()

export const list = (msg: Lista.Msg<Red, Kolona>): Msg => Msg.List({ msg })
export const startCreate = (): Msg => Msg.StartCreate()
export const create = (msg: Create.Msg): Msg => Msg.Create({ msg })
export const filter = (msg: FormMsg<FilterPolja>): Msg => Msg.Filter({ msg })

export type Model = {
  readonly ctx: Create.Context
  readonly lista: Lista.Model<Red, Kolona>
  readonly creating: Option.Option<Create.Model>
  readonly filter: FormModel<FilterPolja>
  readonly filterOtvoren: boolean
}

const konfiguracija = (otpremnicaID: number): Lista.Konfiguracija<Red, Kolona> => ({
  ruta: zahtev => Api.pretraziStavkaOtpremnice({ ...zahtev, criteria: { ...zahtev.criteria, otpremnicaID } }),
  limit: PODRAZUMEVANI_LIMIT,
})

export const init = (ctx: Create.Context, search: string): [Model, Cmd.Cmd<Msg>] => {
  const stanje = Lista.stanjeIzQuery<Kolona>(search, SORTABILNE, PODRAZUMEVANI_SORT)
  const [lista, cmd] = Lista.init(konfiguracija(ctx.otpremnicaID), stanje)
  // Фиока се пуни из истих критеријума из којих је кренула и претрага, па отворен филтер
  // показује оно по чему листа заиста стоји — и после освежавања и после дугмета „назад".
  const [filterModel, filterCmd] = Filter.izKriterijuma(filterSpec, stanje.criteria)
  return [
    { ctx, lista, creating: Option.none(), filter: filterModel, filterOtvoren: false },
    Cmd.batch([Cmd.map(list)(cmd), Cmd.map(filter)(filterCmd)]),
  ]
}

/** Ново стање листе уписано у адресну линију; одатле рутер поново диже екран. */
const upisiUrl = (model: Model): Cmd.Cmd<Msg> => {
  const putanja = rutaPutanja(routes.otpremnicaStavke, { otpremnicaID: model.ctx.otpremnicaID })
  const query = Lista.stanjeUQuery(Lista.stanje(model.lista))
  return Navigation.pushUrl(query === '' ? putanja : putanja + '?' + query)
}

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    List: ({ msg: listaMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [lista, cmd, ishod] = Lista.update(konfiguracija(model.ctx.otpremnicaID), listaMessage, model.lista)
      const sledeci: Model = { ...model, lista }
      switch (ishod._tag) {
        case 'Nastavi':
          return [sledeci, Cmd.map(list)(cmd)]
        case 'StanjePromenjeno':
          return [sledeci, upisiUrl(sledeci)]
        // Двоклик отвара измену; тај екран још не постоји, па се ред само означи.
        case 'Otvoren':
          return [sledeci, Cmd.none]
      }
    },

    Filter: ({ msg: formMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [filterModel, cmd] = filterSpec.forma.update(formMessage, model.filter)
      return [{ ...model, filter: filterModel }, Cmd.map(filter)(cmd)]
    },

    ShowFilter: ({ otvoren }): [Model, Cmd.Cmd<Msg>] => [{ ...model, filterOtvoren: otvoren }, Cmd.none],

    // Претрага иде кроз листу: она подиже `StanjePromenjeno`, а нов URL пише овај екран.
    ApplyFilter: (): [Model, Cmd.Cmd<Msg>] => {
      const zatvoren: Model = { ...model, filterOtvoren: false }
      return update(list(Lista.primeniKriterijume(Filter.uKriterijume(filterSpec, model.filter))), zatvoren)
    },

    ClearFilter: (): [Model, Cmd.Cmd<Msg>] => {
      const [prazan, cmd] = filterSpec.forma.create()
      const [sledeci, listaCmd] = update(list(Lista.primeniKriterijume({})), { ...model, filter: prazan })
      return [sledeci, Cmd.batch([listaCmd, Cmd.map(filter)(cmd)])]
    },

    StartCreate: (): [Model, Cmd.Cmd<Msg>] => {
      const [createModel, cmd] = Create.init(model.ctx)
      return [{ ...model, creating: Option.some(createModel) }, Cmd.map(create)(cmd)]
    },

    // Пресавиј исход: снимљена ставка затвара дијалог и освежава листу.
    Create: ({ msg: createMessage }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.creating)) return [model, Cmd.none]
      const [createModel, cmd, ishod] = Create.update(model.ctx, createMessage, model.creating.value)
      return Create.Outcome.$match(ishod, {
        Active: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, creating: Option.some(createModel) }, Cmd.map(create)(cmd)],
        Success: (): [Model, Cmd.Cmd<Msg>] => {
          const [lista, listaCmd] = Lista.update(
            konfiguracija(model.ctx.otpremnicaID),
            Lista.osvezi<Red, Kolona>(),
            model.lista,
          )
          return [{ ...model, creating: Option.none(), lista }, Cmd.map(list)(listaCmd)]
        },
        Cancel: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, creating: Option.none() }, Cmd.none],
      })
    },
  })

const naslov = (otpremnicaID: number): string => t(S.stavkeOtpremnice.naslov) + ' ' + otpremnicaID

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <StavkeView model={model} dispatch={dispatch} />

const StavkeView = ({ model, dispatch }: { readonly model: Model; readonly dispatch: Platform.Dispatch<Msg> }) => {
  const naListu = (msg: Lista.Msg<Red, Kolona>) => dispatch(list(msg))

  return (
    <Stack vertical gap="m">
      <Stack align="center" justify="between">
        <Title1>{naslov(model.ctx.otpremnicaID)}</Title1>
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
            onClick={() => naListu(Lista.osvezi())}
          />
          <Button appearance="primary" icon={<AddRegular />} onClick={() => dispatch(startCreate())}>
            {t(S.stavkeOtpremnice.dodaj)}
          </Button>
        </Toolbar>
      </Stack>

      <Lista.Tabela
        model={model.lista}
        kolone={kolone}
        sortabilne={SORTABILNE}
        kljuc={red => red.id}
        onSortiraj={kolona => naListu(Lista.sortiraj(kolona))}
        onIzaberi={red => naListu(Lista.izaberi(red))}
        onOtvori={red => naListu(Lista.otvori(red))}
      />

      <Lista.Paginacija
        offset={model.lista.offset}
        limit={PODRAZUMEVANI_LIMIT}
        ukupno={Lista.ukupno(model.lista.podaci)}
        onStrana={offset => naListu(Lista.promeniStranu(offset))}
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

      {Option.isSome(model.creating) && Html.map(create)(Create.view(model.ctx, model.creating.value))(dispatch)}
    </Stack>
  )
}
