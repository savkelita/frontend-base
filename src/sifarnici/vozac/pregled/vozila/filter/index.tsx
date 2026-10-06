import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Form from '../../../../../common/form'
import { contains, eq, predicateValue, range, rangeValue } from '../../../../../common/pretraga'
import { filterBar } from '../../../../../common/pretraga/components/filter-bar'
import type { VoziloCriteria } from '../../../../../evidencija-vozila/api'
import { vForm, type FormValue, type Model } from './model'
import { Msg, changed, cleared, submitted } from './msg'

export * from './model'
export * from './msg'

export const EMPTY: FormValue = {
  registarskaOznaka: null,
  markaVozila: null,
  datumIsticanjaRegistracije: null,
  stanje: null,
}

export const init = (criteria: VoziloCriteria): Model => ({
  value: {
    registarskaOznaka: predicateValue(criteria.registarskaOznaka),
    markaVozila: predicateValue(criteria.markaVozila),
    datumIsticanjaRegistracije: rangeValue(criteria.datumIsticanjaRegistracije),
    stanje: predicateValue(criteria.stanje),
  },
})

export const update = (msg: Msg, model: Model): Model =>
  Msg.$match(msg, {
    Changed: ({ value }): Model => ({ value }),
    Submitted: (): Model => model,
    Cleared: (): Model => ({ value: EMPTY }),
  })

export const toCriteria = (value: FormValue): VoziloCriteria => ({
  registarskaOznaka: contains(value.registarskaOznaka),
  markaVozila: contains(value.markaVozila),
  datumIsticanjaRegistracije: range(value.datumIsticanjaRegistracije),
  stanje: eq(value.stanje),
})

const options: Form.Options<FormValue> = {
  template: locals => (
    <>
      {locals.inputs.registarskaOznaka}
      {locals.inputs.markaVozila}
      {locals.inputs.datumIsticanjaRegistracije}
      {locals.inputs.stanje}
    </>
  ),
  fields: {
    registarskaOznaka: { label: 'Registarska oznaka' },
    markaVozila: { label: 'Marka' },
    datumIsticanjaRegistracije: { label: 'Istice registracija' },
    stanje: { label: 'Stanje', placeholder: 'Sve' },
  },
}

const fields = (model: Model, dispatch: Platform.Dispatch<Msg>) =>
  Form.render({
    schema: vForm(),
    value: model.value,
    onChange: value => dispatch(changed(value)),
    options,
    issues: [],
  })

export const view = (model: Model): TeaReact.Html<Msg> => filterBar(model, fields, submitted, cleared)
