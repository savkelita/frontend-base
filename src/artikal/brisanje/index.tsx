import { Option } from 'effect'
import { DeleteRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { ToolbarActionButton } from '../../common/components/ToolbarActionButton'
import { Form } from '../../common/forms'
import type { ObjekatIdentifikator } from '../../common/platform'
import { errorReport } from '../../common/platform'
import { S, t } from '../../common/strings'
import * as Api from '../api'
import type { ArtikalInfo } from '../api'
import { Msg, Outcome, active, cancel, cancelled, deleteRecord, deleted, failed, success } from './msg'

export { Msg, Outcome } from './msg'

// -------------------------------------------------------------------------------------
// Брисање артикла
// -------------------------------------------------------------------------------------
//
// Најмања радња у модулу, и најбоља мера распореда: и она има свој `Authorization`, свој
// `preduslov` и своје дугме. Екран који је позива не зна ни ко сме да брише ни када се
// сме брисати — само прослеђује идентификатор.

export type Authorization = { readonly funkcionalnosti: { readonly BrisanjeArtikla?: true } }

export const isAuthorized = ({ funkcionalnosti }: Authorization): boolean => funkcionalnosti.BrisanjeArtikla === true

export type Model = { readonly deleting: boolean; readonly error: Option.Option<string> }

export const init: Model = { deleting: false, error: Option.none() }

/** Шта `update` враћа — исти облик у свакој грани. */
export type Result = [Model, Cmd.Cmd<Msg>, Outcome]

export const update = (identifikator: ObjekatIdentifikator, msg: Msg, model: Model): Result =>
  Msg.$match(msg, {
    Delete: (): Result => [
      { deleting: true, error: Option.none() },
      Http.send(Api.obrisiArtikal(identifikator), { onSuccess: deleted, onError: failed }),
      active(),
    ],

    Deleted: (): Result => [{ ...model, deleting: false }, Cmd.none, success()],

    Failed: ({ error }): Result => [
      { deleting: false, error: Option.some(errorReport(error).message) },
      Cmd.none,
      active(),
    ],

    Cancel: (): Result => [model, Cmd.none, cancelled()],
  })

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Form.confirmDialog({
      title: t(S.artikal.brisanje),
      message: t(S.artikal.potvrdaBrisanja),
      busy: model.deleting,
      error: Option.getOrUndefined(model.error),
      onConfirm: () => dispatch(deleteRecord()),
      onCancel: () => dispatch(cancel()),
    })

// -------------------------------------------------------------------------------------
// Дугме радње
// -------------------------------------------------------------------------------------

/** Брише се само артикал у припреми: активан је већ у употреби негде другде. */
export const preduslov = (auth: Authorization, stanje: ArtikalInfo['stanje'] | null): boolean =>
  isAuthorized(auth) && stanje === 'U_PRIPREMI'

export const button = <M,>(
  auth: Authorization,
  stanje: ArtikalInfo['stanje'] | null,
  pokreni: M,
  dispatch: Platform.Dispatch<M>,
) =>
  preduslov(auth, stanje) ? (
    <ToolbarActionButton kind="destructive" icon={<DeleteRegular />} onClick={() => dispatch(pokreni)}>
      {t(S.opste.obrisi)}
    </ToolbarActionButton>
  ) : null
