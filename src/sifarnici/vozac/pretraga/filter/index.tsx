import { makeStyles, tokens } from '@fluentui/react-components'
import { Option, Schema } from 'effect'
import { memo } from 'react'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Combo from '../../../../common/domain/combo'
import * as Form from '../../../../common/form'
import { contains, eq, predicateValue } from '../../../../common/pretraga'
import { FilterButton, FilterDrawer } from '../../../../common/pretraga/filter-drawer'
import type { VozacCriteria } from '../../../api'
import * as Kategorija from '../../../domain/kategorija-vozaca'
import { vForm, type FormValue, type Model } from './model'
import { Msg, changed, cleared, kategorijaMsg, submitted, toggled } from './msg'

export * from './model'
export * from './msg'

const EMPTY: FormValue = {
  ime: null,
  prezime: null,
  imeZaPrikaz: null,
  email: null,
  telefon: null,
  kategorija: null,
  stanje: null,
}

export const ioState = Schema.Struct({ kategorija: Schema.NullOr(Kategorija.ioValue) })

export type State = typeof ioState.Type

export const toState = (value: FormValue): State => ({ kategorija: value.kategorija })

const fromState = (state: unknown): State | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(ioState)(state))

const carried = (id: number | undefined, candidates: ReadonlyArray<Kategorija.Form>): Kategorija.Form =>
  id === undefined ? null : (candidates.find(candidate => candidate !== null && candidate.id === id) ?? null)

export const init = (criteria: VozacCriteria, state: unknown, previous?: Model): [Model, Cmd.Cmd<Msg>] => {
  const kategorija = carried(criteria.kategorijaID, [
    fromState(state)?.kategorija ?? null,
    previous?.value.kategorija ?? null,
  ])
  const [kategorijaCombo, comboCmd] = Combo.init(
    kategorija === null ? criteria.kategorijaID : undefined,
    Kategorija.search,
  )
  return [
    {
      value: {
        ime: predicateValue(criteria.ime),
        prezime: predicateValue(criteria.prezime),
        imeZaPrikaz: predicateValue(criteria.imeZaPrikaz),
        email: predicateValue(criteria.email),
        telefon: predicateValue(criteria.telefon),
        kategorija,
        stanje: predicateValue(criteria.stanje),
      },
      isOpen: previous?.isOpen ?? true,
      kategorijaCombo,
    },
    Cmd.map(kategorijaMsg)(comboCmd),
  ]
}

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Changed: ({ value }): [Model, Cmd.Cmd<Msg>] => [{ ...model, value }, Cmd.none],
    Submitted: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],
    Cleared: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, value: EMPTY, kategorijaCombo: Combo.empty() }, Cmd.none],
    Toggled: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, isOpen: !model.isOpen }, Cmd.none],
    KategorijaMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [kategorijaCombo, comboCmd] = Combo.update(Kategorija.search, comboMessage, model.kategorijaCombo)
      const value =
        comboMessage._tag === 'Selected' || comboMessage._tag === 'Initialized'
          ? { ...model.value, kategorija: comboMessage.values[0] ?? null }
          : model.value
      return [{ ...model, kategorijaCombo, value }, Cmd.map(kategorijaMsg)(comboCmd)]
    },
  })

export const toCriteria = (value: FormValue): VozacCriteria => ({
  ime: contains(value.ime),
  prezime: contains(value.prezime),
  imeZaPrikaz: contains(value.imeZaPrikaz),
  email: contains(value.email),
  telefon: contains(value.telefon),
  kategorijaID: value.kategorija?.id,
  stanje: eq(value.stanje),
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
      {locals.inputs.ime}
      {locals.inputs.prezime}
      {locals.inputs.imeZaPrikaz}
      {locals.inputs.email}
      {locals.inputs.telefon}
      {locals.inputs.kategorija}
      {locals.inputs.stanje}
    </div>
  ),
  fields: {
    ime: { label: 'Ime' },
    prezime: { label: 'Prezime' },
    imeZaPrikaz: { label: 'Ime za prikaz' },
    email: { label: 'E-mail' },
    telefon: { label: 'Telefon' },
    kategorija: {
      label: 'Kategorija',
      placeholder: 'Sve',
      model: model.kategorijaCombo,
      onMsg: (msg: Combo.Msg<Kategorija.Value>) => dispatch(kategorijaMsg(msg)),
    },
    stanje: { label: 'Stanje', placeholder: 'Sve' },
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
