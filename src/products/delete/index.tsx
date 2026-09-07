import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Form } from '../../common/forms'
import * as Api from '../api'
import type { Model } from './model'
import { Msg, confirm, cancel, deleted, failed } from './msg'

export type { Model }
export type { Msg }
export { init } from './model'

// -------------------------------------------------------------------------------------
// Delete — always a confirmation dialog (Magacin: brisanje)
// -------------------------------------------------------------------------------------
//
// The host owns nothing but the id; the feature signals completion via `Outcome`, which
// the host folds (Deleted -> close + refresh, Cancelled -> close).

export type Outcome = 'Active' | 'Deleted' | 'Cancelled'

export const update = (id: number, msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>, Outcome] =>
  Msg.$match(msg, {
    Confirm: (): [Model, Cmd.Cmd<Msg>, Outcome] => [
      { deleting: true, error: Option.none() },
      Http.send(Api.deleteProduct({ id }), { onSuccess: () => deleted(), onError: failed }),
      'Active',
    ],
    Cancel: (): [Model, Cmd.Cmd<Msg>, Outcome] => [model, Cmd.none, 'Cancelled'],
    Deleted: (): [Model, Cmd.Cmd<Msg>, Outcome] => [model, Cmd.none, 'Deleted'],
    Failed: ({ error }): [Model, Cmd.Cmd<Msg>, Outcome] => [
      { deleting: false, error: Option.some(error) },
      Cmd.none,
      'Active',
    ],
  })

export const view =
  (model: Model, title: string): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Form.confirmDialog({
      title: 'Brisanje proizvoda',
      message: `Da li ste sigurni da želite da obrišete „${title}"?`,
      confirmLabel: 'Obriši',
      onConfirm: () => dispatch(confirm()),
      onCancel: () => dispatch(cancel()),
      busy: model.deleting,
      error: Option.isSome(model.error) ? 'Brisanje nije uspelo. Pokušajte ponovo.' : undefined,
    })
