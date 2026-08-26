import * as Combo from '../../../common/domain/combo'
import * as Api from '../../api'

export type Value = Api.ModelVozilaCombo

export type Form = Combo.Form<Value>

export const ioValue = Api.ModelVozilaCombo

export const id = (model: Value): string => model.model

export const render = (model: Value): string => model.model

export const search =
  (marka: string): Combo.Source<Value> =>
  request =>
    Api.pretraziModelVozilaCombo({ ...request, criteria: { ...request.criteria, marka: ['eq', marka] } })

export const vForm = Combo.vForm(ioValue, { id, render })

export const fromText = (model: string): Value => ({ model })
