import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Form } from '../../common/forms'
import type { FormDialogState } from '../../common/forms'
import * as Api from '../api'
import type { Model } from './model'
import { Msg, loaded, loadFailed, formMsg, submit, saved, failed, cancel } from './msg'
import { ProductEditForm, layout, toDraft, toUpdateBody, fields } from './form'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Update — like Magacin: signals the host via `Outcome` (Saved -> close + refresh,
// Cancelled -> close). Hosted as a dialog (see products list).
// -------------------------------------------------------------------------------------

export type Outcome = 'Active' | 'Saved' | 'Cancelled'

/** Start editing product `id`: load the record (daj-info), then edit it. */
export const init = (id: number): [Model, Cmd.Cmd<Msg>] => [
  { status: 'Loading', id },
  Http.send(Api.getProduct(id), { onSuccess: loaded, onError: loadFailed }),
]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>, Outcome] =>
  Msg.$match(msg, {
    Loaded: ({ record }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      const [form, cmd] = ProductEditForm.edit(toDraft(record))
      return [
        { status: 'Ready', loaded: { form, original: { id: record.id, version: 0 }, error: Option.none() } },
        Cmd.map(formMsg)(cmd),
        'Active',
      ]
    },

    LoadFailed: ({ error }): [Model, Cmd.Cmd<Msg>, Outcome] => [{ status: 'Failed', error }, Cmd.none, 'Active'],

    Form: ({ msg: formMessage }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model.status !== 'Ready') return [model, Cmd.none, 'Active']
      const [form, cmd] = ProductEditForm.update(formMessage, model.loaded.form)
      return [{ ...model, loaded: { ...model.loaded, form } }, Cmd.map(formMsg)(cmd), 'Active']
    },

    Submit: (): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model.status !== 'Ready') return [model, Cmd.none, 'Active']
      const [form, payload] = ProductEditForm.trySubmit(model.loaded.form)
      return Option.match(payload, {
        onNone: (): [Model, Cmd.Cmd<Msg>, Outcome] => [
          { ...model, loaded: { ...model.loaded, form } },
          Cmd.none,
          'Active',
        ],
        onSome: (validated): [Model, Cmd.Cmd<Msg>, Outcome] => [
          { ...model, loaded: { ...model.loaded, form, error: Option.none() } },
          Http.send(Api.updateProduct(toUpdateBody(validated, model.loaded.original)), {
            onSuccess: () => saved(),
            onError: failed,
          }),
          'Active',
        ],
      })
    },

    Saved: (): [Model, Cmd.Cmd<Msg>, Outcome] => [model, Cmd.none, 'Saved'],

    Failed: ({ error }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model.status !== 'Ready') return [model, Cmd.none, 'Active']
      return [
        {
          ...model,
          loaded: { ...model.loaded, form: ProductEditForm.toEditing(model.loaded.form), error: Option.some(error) },
        },
        Cmd.none,
        'Active',
      ]
    },

    Cancel: (): [Model, Cmd.Cmd<Msg>, Outcome] => [model, Cmd.none, 'Cancelled'],
  })

// -------------------------------------------------------------------------------------
// View — a dialog; it owns the load-state (spinner while the record loads)
// -------------------------------------------------------------------------------------

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => {
    const state: FormDialogState<typeof fields> =
      model.status === 'Loading'
        ? { status: 'Loading' }
        : model.status === 'Failed'
          ? { status: 'Failed', error: 'Neuspešno učitavanje proizvoda.' }
          : { status: 'Ready', model: model.loaded.form }

    return Form.dialog({
      spec: ProductEditForm,
      state,
      layout,
      title: 'Izmena proizvoda',
      dispatch: m => dispatch(formMsg(m)),
      onSubmit: () => dispatch(submit()),
      onClose: () => dispatch(cancel()),
      error:
        model.status === 'Ready' && Option.isSome(model.loaded.error)
          ? 'Snimanje nije uspelo. Pokušajte ponovo.'
          : undefined,
      width: 700,
    })
  }
