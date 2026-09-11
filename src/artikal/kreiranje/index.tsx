import { Option } from 'effect'
import { AddRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { ToolbarActionButton } from '../../common/components/ToolbarActionButton'
import { Form } from '../../common/forms'
import type { SavableForm } from '../../common/forms'
import { errorReport } from '../../common/platform'
import { S, t } from '../../common/strings'
import * as Api from '../api'
import { ArtikalForm, layout } from './form'
import type { Fields } from './form'
import { Msg, Outcome, active, cancel, cancelled, failed, form, save, saved, success } from './msg'

// Конструктори порука иду напоље као вредности: домаћин их шаље радњи, а тестови их зову.
export { Msg, Outcome } from './msg'

// -------------------------------------------------------------------------------------
// Креирање артикла
// -------------------------------------------------------------------------------------
//
// Распоред једне радње, исти као у затеченом стеку: `Authorization` / `isAuthorized`,
// `init`, `update` са исходом, `view`, и на крају `preduslov` + `button`. Дугме припада
// радњи, не екрану који је позива — тако екран не зна ни која су права потребна ни како се
// радња зове.

/** Иста форма као при измени, само без учитавања и без оригинала. */
export type Model = SavableForm<Fields>

export type Authorization = { readonly funkcionalnosti: { readonly KreiranjeArtikla?: true } }

export const isAuthorized = ({ funkcionalnosti }: Authorization): boolean => funkcionalnosti.KreiranjeArtikla === true

export const init = (): [Model, Cmd.Cmd<Msg>] => {
  const [formModel, cmd] = ArtikalForm.create()
  return [{ form: formModel, saving: false, error: Option.none() }, Cmd.map(form)(cmd)]
}

/** Шта `update` враћа — исти облик у свакој грани. */
export type Result = [Model, Cmd.Cmd<Msg>, Outcome]

export const update = (msg: Msg, model: Model): Result =>
  Msg.$match(msg, {
    Form: ({ msg: formMsg }): Result => {
      const [formModel, cmd] = ArtikalForm.update(formMsg, model.form)
      return [{ ...model, form: formModel }, Cmd.map(form)(cmd), active()]
    },

    Save: (): Result => {
      const [formModel, payload] = ArtikalForm.trySubmit(model.form)
      return Option.match(payload, {
        // Неисправан унос: `trySubmit` је већ обележио поља, нема шта да се шаље.
        onNone: (): Result => [{ ...model, form: formModel }, Cmd.none, active()],
        onSome: (vrednosti): Result => [
          { ...model, form: formModel, saving: true, error: Option.none() },
          Http.send(
            Api.kreirajArtikal({
              sifra: vrednosti.sifra,
              naziv: vrednosti.naziv,
              skraceniNaziv: vrednosti.skraceniNaziv,
              jedinicaMereID: vrednosti.jedinicaMere,
              grupaArtiklaID: vrednosti.grupaArtikla,
              kolicinaUJediniciMere: vrednosti.kolicinaUJediniciMere,
            }),
            { onSuccess: saved, onError: failed },
          ),
          active(),
        ],
      })
    },

    Saved: ({ identifikator }): Result => [{ ...model, saving: false }, Cmd.none, success(identifikator)],

    // Пословне грешке иду изнад форме, све заједно — исто као у затеченим пројектима.
    // Envelope носи `code`, не име поља, па се без договорене табеле шифара оне не могу
    // везати за поједино поље.
    Failed: ({ error }): Result => [
      { ...model, saving: false, error: Option.some(errorReport(error).message) },
      Cmd.none,
      active(),
    ],

    Cancel: (): Result => [model, Cmd.none, cancelled()],
  })

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Form.dialog({
      spec: ArtikalForm,
      layout,
      title: t(S.artikal.kreiranje),
      ...Form.dialogProps(model),
      dispatch: msg => dispatch(form(msg)),
      onSubmit: () => dispatch(save()),
      onClose: () => dispatch(cancel()),
    })

// -------------------------------------------------------------------------------------
// Дугме радње
// -------------------------------------------------------------------------------------

export const preduslov = (auth: Authorization): boolean => isAuthorized(auth)

export const button = <M,>(auth: Authorization, pokreni: M, dispatch: Platform.Dispatch<M>) =>
  preduslov(auth) ? (
    <ToolbarActionButton kind="primaryCreate" icon={<AddRegular />} onClick={() => dispatch(pokreni)}>
      {t(S.opste.novi)}
    </ToolbarActionButton>
  ) : null
