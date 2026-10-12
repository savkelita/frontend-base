import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Form from '../../../../../common/form'
import { filterBar } from '../../../../../common/pretraga/components/filter-bar'
import * as DateFilter from '../../../../../common/pretraga/filter-date'
import * as EnumFilter from '../../../../../common/pretraga/filter-enum'
import * as TextFilter from '../../../../../common/pretraga/filter-text'
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
    registarskaOznaka: criteria.registarskaOznaka ?? null,
    markaVozila: criteria.markaVozila ?? null,
    datumIsticanjaRegistracije: DateFilter.fromCriteria(criteria.datumIsticanjaRegistracije),
    stanje: criteria.stanje ?? null,
  },
})

export const update = (msg: Msg, model: Model): Model =>
  Msg.$match(msg, {
    Changed: ({ value }): Model => ({ value }),
    Submitted: (): Model => model,
    Cleared: (): Model => ({ value: EMPTY }),
  })

export const toCriteria = (value: FormValue): VoziloCriteria => ({
  registarskaOznaka: TextFilter.toCriteria(value.registarskaOznaka),
  markaVozila: TextFilter.toCriteria(value.markaVozila),
  datumIsticanjaRegistracije: DateFilter.toCriteria(value.datumIsticanjaRegistracije),
  stanje: EnumFilter.toCriteria(value.stanje),
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
