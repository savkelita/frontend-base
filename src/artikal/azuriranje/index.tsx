import { Option } from 'effect'
import { EditRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { ToolbarActionButton } from '../../common/components/ToolbarActionButton'
import { Form } from '../../common/forms'
import type { EditableForm } from '../../common/forms'
import { errorReport } from '../../common/platform'
import * as State from '../../common/state'
import { S, t } from '../../common/strings'
import * as Api from '../api'
import type { ArtikalInfo } from '../api'
import { ArtikalForm, initialForm, layout } from './form'
import type { Fields } from './form'
import { Msg, Outcome, active, cancel, cancelled, failed, form, loaded, save, saveFailed, saved, success } from './msg'

export { Msg, Outcome } from './msg'

// -------------------------------------------------------------------------------------
// Ажурирање артикла
// -------------------------------------------------------------------------------------
//
// Форма је иста као при креирању; разлику носи режим `edit`, у ком шифра постаје само за
// читање. `version` из учитаног записа враћа се серверу непромењен — на њему почива
// оптимистично закључавање.
//
/**
 * Три гране учитавања стоје у `common/state`, а оно што је у учитаној грани — форма, знак
 * да упис траје, порука сервера — у `common/forms`. Овде је само спој та два: измена уз
 * форму носи и учитан запис, због version-а који мора да се врати серверу непромењен.
 */
export type Model = State.Load<EditableForm<Fields, ArtikalInfo>>

export type Authorization = { readonly funkcionalnosti: { readonly AzuriranjeArtikla?: true } }

export const isAuthorized = ({ funkcionalnosti }: Authorization): boolean => funkcionalnosti.AzuriranjeArtikla === true

export const init = (artikalID: number): [Model, Cmd.Cmd<Msg>] => [
  State.loading,
  Http.send(Api.dajArtikal({ artikalID }), { onSuccess: loaded, onError: failed }),
]

/** Шта `update` враћа — исти облик у свакој грани. */
export type Result = [Model, Cmd.Cmd<Msg>, Outcome]

export const update = (msg: Msg, model: Model): Result => {
  const onLoaded = State.onLoaded(model, msg, active())

  return Msg.$match(msg, {
    Loaded: ({ original }): Result => {
      const [formModel, cmd] = ArtikalForm.edit(initialForm(original))
      return [
        State.loaded({ original, form: formModel, saving: false, error: Option.none() }),
        Cmd.map(form)(cmd),
        active(),
      ]
    },

    Failed: ({ error }): Result => [State.failed(errorReport(error).message), Cmd.none, active()],

    Form: ({ msg: formMsg }): Result =>
      onLoaded(state => {
        const [formModel, cmd] = ArtikalForm.update(formMsg, state.form)
        return [State.loaded({ ...state, form: formModel }), Cmd.map(form)(cmd), active()]
      }),

    Save: (): Result =>
      onLoaded(state => {
        const [formModel, payload] = ArtikalForm.trySubmit(state.form)
        return Option.match(payload, {
          onNone: (): Result => [State.loaded({ ...state, form: formModel }), Cmd.none, active()],
          onSome: (vrednosti): Result => [
            State.loaded({ ...state, form: formModel, saving: true, error: Option.none() }),
            Http.send(
              Api.azurirajArtikal({
                id: state.original.id,
                version: state.original.version,
                sifra: state.original.sifra,
                naziv: vrednosti.naziv,
                skraceniNaziv: vrednosti.skraceniNaziv,
                jedinicaMereID: vrednosti.jedinicaMere,
                grupaArtiklaID: vrednosti.grupaArtikla,
                kolicinaUJediniciMere: vrednosti.kolicinaUJediniciMere,
              }),
              { onSuccess: saved, onError: saveFailed },
            ),
            active(),
          ],
        })
      }),

    Saved: (): Result => [model, Cmd.none, success()],

    // Пословне грешке иду изнад форме, све заједно — envelope носи `code`, не име поља.
    SaveFailed: ({ error }): Result =>
      onLoaded(state => [
        State.loaded({ ...state, saving: false, error: Option.some(errorReport(error).message) }),
        Cmd.none,
        active(),
      ]),

    Cancel: (): Result => [model, Cmd.none, cancelled()],
  })
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Form.dialog({
      spec: ArtikalForm,
      layout: layout(State.valueOf(model)?.original),
      title: t(S.artikal.azuriranje),
      ...Form.dialogProps(model),
      dispatch: msg => dispatch(form(msg)),
      onSubmit: () => dispatch(save()),
      onClose: () => dispatch(cancel()),
    })

// -------------------------------------------------------------------------------------
// Дугме радње
// -------------------------------------------------------------------------------------

/** Артикал у припреми и активан артикал се мењају; неактиван више не. */
export const preduslov = (auth: Authorization, stanje: ArtikalInfo['stanje'] | null): boolean =>
  isAuthorized(auth) && stanje !== 'NEAKTIVAN'

export const button = <M,>(
  auth: Authorization,
  stanje: ArtikalInfo['stanje'] | null,
  pokreni: M,
  dispatch: Platform.Dispatch<M>,
) =>
  preduslov(auth, stanje) ? (
    <ToolbarActionButton kind="neutralWork" icon={<EditRegular />} onClick={() => dispatch(pokreni)}>
      {t(S.opste.izmeni)}
    </ToolbarActionButton>
  ) : null
