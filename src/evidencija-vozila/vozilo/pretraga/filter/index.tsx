import { makeStyles, tokens } from '@fluentui/react-components'
import { Option, Schema } from 'effect'
import { memo } from 'react'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Combo from '../../../../common/domain/combo'
import * as Form from '../../../../common/form'
import { contains, eq, predicateValue, range, rangeValue } from '../../../../common/pretraga'
import { FilterButton, FilterDrawer } from '../../../../common/pretraga/components/filter-drawer'
import * as KorisnikVozila from '../../../../sifarnici/domain/korisnik-vozila'
import * as MarkaVozila from '../../../../sifarnici/domain/marka-vozila'
import * as ModelVozila from '../../../../sifarnici/domain/model-vozila'
import * as Vozac from '../../../../sifarnici/domain/vozac'
import * as VrstaGoriva from '../../../../sifarnici/domain/vrsta-goriva'
import * as VrstaVozila from '../../../../sifarnici/domain/vrsta-vozila'
import type { VoziloCriteria } from '../../../api'
import { vForm, type FormValue, type Model } from './model'
import {
  Msg,
  changed,
  cleared,
  korisnikVozilaMsg,
  markaMsg,
  modelMsg,
  submitted,
  toggled,
  vozacMsg,
  vrstaGorivaMsg,
  vrstaVozilaMsg,
} from './msg'

export * from './model'
export * from './msg'

const EMPTY: FormValue = {
  registarskaOznaka: null,
  markaVozila: null,
  modelVozila: null,
  vrstaGoriva: null,
  vrstaVozila: null,
  korisnikVozila: null,
  vozac: null,
  datumPrveRegistracije: null,
  datumIsticanjaRegistracije: null,
  dostavljaMesecnuKm: null,
  stanje: null,
  istekRegistracije: null,
}

export const ioState = Schema.Struct({
  vrstaGoriva: Schema.NullOr(VrstaGoriva.ioValue),
  vrstaVozila: Schema.NullOr(VrstaVozila.ioValue),
  korisnikVozila: Schema.NullOr(KorisnikVozila.ioValue),
  vozac: Schema.NullOr(Vozac.ioValue),
})

export type State = typeof ioState.Type

export const toState = (value: FormValue): State => ({
  vrstaGoriva: value.vrstaGoriva,
  vrstaVozila: value.vrstaVozila,
  korisnikVozila: value.korisnikVozila,
  vozac: value.vozac,
})

const fromState = (state: unknown): State | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(ioState)(state))

const carried = <A extends { readonly id: number }>(
  id: number | undefined,
  candidates: ReadonlyArray<A | null>,
): A | null => (id === undefined ? null : (candidates.find(candidate => candidate?.id === id) ?? null))

const izabrano = <A,>(msg: Combo.Msg<A>, current: A | null): A | null =>
  msg._tag === 'Selected' || msg._tag === 'Initialized' ? (msg.values[0] ?? null) : current

export const init = (criteria: VoziloCriteria, state: unknown, previous?: Model): [Model, Cmd.Cmd<Msg>] => {
  const preneto = fromState(state)

  const vrstaGoriva = carried(criteria.vrstaGorivaID, [
    preneto?.vrstaGoriva ?? null,
    previous?.value.vrstaGoriva ?? null,
  ])
  const vrstaVozila = carried(criteria.vrstaVozilaID, [
    preneto?.vrstaVozila ?? null,
    previous?.value.vrstaVozila ?? null,
  ])
  const korisnikVozila = carried(criteria.korisnikVozilaID, [
    preneto?.korisnikVozila ?? null,
    previous?.value.korisnikVozila ?? null,
  ])
  const vozac = carried(criteria.vozacID, [preneto?.vozac ?? null, previous?.value.vozac ?? null])

  const [vrstaGorivaCombo, vrstaGorivaCmd] = Combo.init(
    vrstaGoriva === null ? criteria.vrstaGorivaID : undefined,
    VrstaGoriva.search,
  )
  const [vrstaVozilaCombo, vrstaVozilaCmd] = Combo.init(
    vrstaVozila === null ? criteria.vrstaVozilaID : undefined,
    VrstaVozila.search,
  )
  const [korisnikVozilaCombo, korisnikVozilaCmd] = Combo.init(
    korisnikVozila === null ? criteria.korisnikVozilaID : undefined,
    KorisnikVozila.search,
  )
  const [vozacCombo, vozacCmd] = Combo.init(vozac === null ? criteria.vozacID : undefined, Vozac.search)

  return [
    {
      value: {
        registarskaOznaka: predicateValue(criteria.registarskaOznaka),
        markaVozila: criteria.markaVozila === undefined ? null : MarkaVozila.fromText(criteria.markaVozila[1]),
        modelVozila: criteria.modelVozila === undefined ? null : ModelVozila.fromText(criteria.modelVozila[1]),
        vrstaGoriva,
        vrstaVozila,
        korisnikVozila,
        vozac,
        datumPrveRegistracije: rangeValue(criteria.datumPrveRegistracije),
        datumIsticanjaRegistracije: rangeValue(criteria.datumIsticanjaRegistracije),
        dostavljaMesecnuKm: criteria.dostavljaMesecnuKm ?? null,
        stanje: predicateValue(criteria.stanje),
        istekRegistracije: predicateValue(criteria.istekRegistracije),
      },
      isOpen: previous?.isOpen ?? true,
      markaCombo: Combo.empty<MarkaVozila.Value>(),
      modelCombo: Combo.empty<ModelVozila.Value>(),
      vrstaGorivaCombo,
      vrstaVozilaCombo,
      korisnikVozilaCombo,
      vozacCombo,
    },
    Cmd.batch([
      Cmd.map(vrstaGorivaMsg)(vrstaGorivaCmd),
      Cmd.map(vrstaVozilaMsg)(vrstaVozilaCmd),
      Cmd.map(korisnikVozilaMsg)(korisnikVozilaCmd),
      Cmd.map(vozacMsg)(vozacCmd),
    ]),
  ]
}

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Changed: ({ value }): [Model, Cmd.Cmd<Msg>] => [{ ...model, value }, Cmd.none],

    Submitted: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],

    Cleared: (): [Model, Cmd.Cmd<Msg>] => [
      {
        ...model,
        value: EMPTY,
        markaCombo: Combo.empty<MarkaVozila.Value>(),
        modelCombo: Combo.empty<ModelVozila.Value>(),
        vrstaGorivaCombo: Combo.empty<VrstaGoriva.Value>(),
        vrstaVozilaCombo: Combo.empty<VrstaVozila.Value>(),
        korisnikVozilaCombo: Combo.empty<KorisnikVozila.Value>(),
        vozacCombo: Combo.empty<Vozac.Value>(),
      },
      Cmd.none,
    ],

    Toggled: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, isOpen: !model.isOpen }, Cmd.none],

    MarkaMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [markaCombo, comboCmd] = Combo.update(MarkaVozila.search, comboMessage, model.markaCombo)
      const markaVozila = izabrano(comboMessage, model.value.markaVozila)
      const cmd = Cmd.map(markaMsg)(comboCmd)
      return markaVozila?.marka === model.value.markaVozila?.marka
        ? [{ ...model, markaCombo }, cmd]
        : [
            {
              ...model,
              markaCombo,
              modelCombo: Combo.empty<ModelVozila.Value>(),
              value: { ...model.value, markaVozila, modelVozila: null },
            },
            cmd,
          ]
    },

    ModelMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [modelCombo, comboCmd] = Combo.update(
        ModelVozila.search(model.value.markaVozila?.marka ?? ''),
        comboMessage,
        model.modelCombo,
      )
      const modelVozila = izabrano(comboMessage, model.value.modelVozila)
      return [{ ...model, modelCombo, value: { ...model.value, modelVozila } }, Cmd.map(modelMsg)(comboCmd)]
    },

    VrstaGorivaMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [vrstaGorivaCombo, comboCmd] = Combo.update(VrstaGoriva.search, comboMessage, model.vrstaGorivaCombo)
      const vrstaGoriva = izabrano(comboMessage, model.value.vrstaGoriva)
      return [{ ...model, vrstaGorivaCombo, value: { ...model.value, vrstaGoriva } }, Cmd.map(vrstaGorivaMsg)(comboCmd)]
    },

    VrstaVozilaMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [vrstaVozilaCombo, comboCmd] = Combo.update(VrstaVozila.search, comboMessage, model.vrstaVozilaCombo)
      const vrstaVozila = izabrano(comboMessage, model.value.vrstaVozila)
      return [{ ...model, vrstaVozilaCombo, value: { ...model.value, vrstaVozila } }, Cmd.map(vrstaVozilaMsg)(comboCmd)]
    },

    KorisnikVozilaMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [korisnikVozilaCombo, comboCmd] = Combo.update(
        KorisnikVozila.search,
        comboMessage,
        model.korisnikVozilaCombo,
      )
      const korisnikVozila = izabrano(comboMessage, model.value.korisnikVozila)
      return [
        { ...model, korisnikVozilaCombo, value: { ...model.value, korisnikVozila } },
        Cmd.map(korisnikVozilaMsg)(comboCmd),
      ]
    },

    VozacMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [vozacCombo, comboCmd] = Combo.update(Vozac.search, comboMessage, model.vozacCombo)
      const vozac = izabrano(comboMessage, model.value.vozac)
      return [{ ...model, vozacCombo, value: { ...model.value, vozac } }, Cmd.map(vozacMsg)(comboCmd)]
    },
  })

export const toCriteria = (value: FormValue): VoziloCriteria => ({
  registarskaOznaka: contains(value.registarskaOznaka),
  markaVozila: eq(value.markaVozila?.marka ?? null),
  modelVozila: eq(value.modelVozila?.model ?? null),
  vrstaGorivaID: value.vrstaGoriva?.id,
  vrstaVozilaID: value.vrstaVozila?.id,
  korisnikVozilaID: value.korisnikVozila?.id,
  vozacID: value.vozac?.id,
  datumPrveRegistracije: range(value.datumPrveRegistracije),
  datumIsticanjaRegistracije: range(value.datumIsticanjaRegistracije),
  dostavljaMesecnuKm: value.dostavljaMesecnuKm ?? undefined,
  stanje: eq(value.stanje),
  istekRegistracije: eq(value.istekRegistracije),
})

const useStyles = makeStyles({
  fields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

const options = (fields: string, model: Model, dispatch: Platform.Dispatch<Msg>): Form.Options<FormValue> => ({
  template: locals => (
    <div className={fields}>
      {locals.inputs.registarskaOznaka}
      {locals.inputs.markaVozila}
      {locals.inputs.modelVozila}
      {locals.inputs.vrstaGoriva}
      {locals.inputs.vrstaVozila}
      {locals.inputs.korisnikVozila}
      {locals.inputs.vozac}
      {locals.inputs.stanje}
      {locals.inputs.dostavljaMesecnuKm}
      {locals.inputs.istekRegistracije}
      {locals.inputs.datumPrveRegistracije}
      {locals.inputs.datumIsticanjaRegistracije}
    </div>
  ),
  fields: {
    registarskaOznaka: { label: 'Registarska oznaka' },
    markaVozila: {
      label: 'Marka vozila',
      placeholder: 'Sve',
      model: model.markaCombo,
      onMsg: (msg: Combo.Msg<MarkaVozila.Value>) => dispatch(markaMsg(msg)),
    },
    modelVozila: {
      label: 'Model vozila',
      placeholder: model.value.markaVozila === null ? 'Prvo izaberite marku' : 'Svi',
      disabled: model.value.markaVozila === null,
      model: model.modelCombo,
      onMsg: (msg: Combo.Msg<ModelVozila.Value>) => dispatch(modelMsg(msg)),
    },
    vrstaGoriva: {
      label: 'Vrsta goriva',
      placeholder: 'Sve',
      model: model.vrstaGorivaCombo,
      onMsg: (msg: Combo.Msg<VrstaGoriva.Value>) => dispatch(vrstaGorivaMsg(msg)),
    },
    vrstaVozila: {
      label: 'Vrsta vozila',
      placeholder: 'Sve',
      model: model.vrstaVozilaCombo,
      onMsg: (msg: Combo.Msg<VrstaVozila.Value>) => dispatch(vrstaVozilaMsg(msg)),
    },
    korisnikVozila: {
      label: 'Korisnik vozila',
      placeholder: 'Svi',
      model: model.korisnikVozilaCombo,
      onMsg: (msg: Combo.Msg<KorisnikVozila.Value>) => dispatch(korisnikVozilaMsg(msg)),
    },
    vozac: {
      label: 'Vozac',
      placeholder: 'Svi',
      model: model.vozacCombo,
      onMsg: (msg: Combo.Msg<Vozac.Value>) => dispatch(vozacMsg(msg)),
    },
    datumPrveRegistracije: { label: 'Datum prve registracije' },
    datumIsticanjaRegistracije: { label: 'Datum isticanja registracije' },
    dostavljaMesecnuKm: { label: 'Dostavlja zavrsnu mesecnu km', placeholder: 'Sve' },
    stanje: { label: 'Stanje', placeholder: 'Sve' },
    istekRegistracije: { label: 'Broj dana do isteka registracije', placeholder: 'Sve' },
  },
})

const FilterView = memo(({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()

  return (
    <FilterDrawer
      open={model.isOpen}
      onClose={() => dispatch(toggled())}
      onSubmit={() => dispatch(submitted())}
      onClear={() => dispatch(cleared())}
    >
      {Form.render({
        schema: vForm(),
        value: model.value,
        onChange: value => dispatch(changed(value)),
        options: options(styles.fields, model, dispatch),
        issues: [],
      })}
    </FilterDrawer>
  )
})

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <FilterView model={model} dispatch={dispatch} />

export const button =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <FilterButton open={model.isOpen} onToggle={() => dispatch(toggled())} />
