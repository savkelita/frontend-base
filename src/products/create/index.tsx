import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Form } from '../../common/forms'
import * as Api from '../api'
import type { Model } from './model'
import { Msg, formMsg, submit, saved, failed } from './msg'
import { ProductForm, layout } from './form'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

const [form0, formCmd0] = ProductForm.create()

export const init: [Model, Cmd.Cmd<Msg>] = [
  { form: form0, error: Option.none(), saved: Option.none() },
  Cmd.map(formMsg)(formCmd0),
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Form: ({ msg: formMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [form, cmd] = ProductForm.update(formMessage, model.form)
      return [{ ...model, form }, Cmd.map(formMsg)(cmd)]
    },

    Submit: (): [Model, Cmd.Cmd<Msg>] => {
      const [form, payload] = ProductForm.trySubmit(model.form)
      return Option.match(payload, {
        onNone: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, form }, Cmd.none],
        onSome: (validated): [Model, Cmd.Cmd<Msg>] => [
          { ...model, form, error: Option.none() },
          Http.send(Api.createProduct(validated), { onSuccess: saved, onError: failed }),
        ],
      })
    },

    Saved: ({ product }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, form: ProductForm.toEditing(model.form), saved: Option.some(product) },
      Navigation.pushUrl('/products'),
    ],

    Failed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, form: ProductForm.toEditing(model.form), error: Option.some(error) },
      Cmd.none,
    ],
  })

// -------------------------------------------------------------------------------------
// View — the standard form view; layout comes from ./form
// -------------------------------------------------------------------------------------

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Form.page({
      spec: ProductForm,
      model: model.form,
      layout,
      title: 'New product',
      error: Option.isSome(model.error) ? 'Snimanje nije uspelo. Pokušajte ponovo.' : undefined,
      dispatch: m => dispatch(formMsg(m)),
      onSubmit: () => dispatch(submit()),
      cancel: { label: 'Odustani', href: '/products' },
    })
