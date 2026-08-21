import { Button, Text } from '@fluentui/react-components'
import { DeleteRegular } from '@fluentui/react-icons'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { hasAllFunkcionalnosti, type AuthorizationConfig, type Funkcionalnost } from '../../../auth/types'
import { mapHttpError, reportError } from '../../../common/error'
import { ErrorView } from '../../../common/error/view'
import { ConfirmDialog } from '../../../common/form/dialog'
import * as Api from '../../api'
import type { Vozac } from '../../api'
import type { Model } from './model'
import { Msg, closed, deleteFailed, deleted, submitted } from './msg'

export * from './model'
export * from './msg'

const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['BrisanjeVozaca']

const isAuthorized = (config: AuthorizationConfig): boolean => hasAllFunkcionalnosti(config, FUNKCIONALNOSTI)

export const button =
  <M,>(config: AuthorizationConfig, start: (vozac: Vozac) => M, vozac: Vozac | undefined): TeaReact.Html<M> =>
  (dispatch: Platform.Dispatch<M>) =>
    isAuthorized(config) && vozac !== undefined ? (
      <Button icon={<DeleteRegular />} onClick={() => dispatch(start(vozac))}>
        Obrisi
      </Button>
    ) : null

export const init = (vozac: Vozac): [Model, Cmd.Cmd<Msg>] => [
  { vozac, isDeleting: false, error: Option.none() },
  Cmd.none,
]

const obrisi = (vozac: Vozac): Cmd.Cmd<Msg> =>
  Http.send(Api.obrisiVozac({ id: vozac.id, version: vozac.version }), {
    onSuccess: () => deleted(),
    onError: error => deleteFailed(mapHttpError(error)),
  })

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Submitted: (): [Model, Cmd.Cmd<Msg>] => {
      if (model.isDeleting) return [model, Cmd.none]
      return [{ ...model, isDeleting: true, error: Option.none() }, obrisi(model.vozac)]
    },

    Deleted: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, isDeleting: false }, Cmd.none],

    DeleteFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isDeleting: false, error: Option.some(error) },
      Cmd.none,
    ],

    Closed: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],
  })

const BrisanjeView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => (
  <ConfirmDialog
    title="Brisanje vozaca"
    confirmLabel="Obrisi"
    isSubmitting={model.isDeleting}
    onConfirm={() => dispatch(submitted())}
    onCancel={() => dispatch(closed())}
  >
    <Text>Da li ste sigurni da zelite da obrisete vozaca {model.vozac.imeZaPrikaz}?</Text>
    {Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
  </ConfirmDialog>
)

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <BrisanjeView model={model} dispatch={dispatch} />
