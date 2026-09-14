import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Api from '../api'
import type { Payload } from '../../common/shema/forma'
import { mapHttpError, reportError, type ApiError } from '../../common/shema/error'
import { ErrorView } from '../../common/shema/error/view'
import { FormDialog } from '../../common/shema/form/dialog'
import { S, t } from '../../common/strings'
import { form, layout, type Fields, type FormModel } from './form'
import { Msg, Outcome, active, cancelled, closed, formMsg, saveFailed, saved, submitted, success } from './msg'

export { Msg, Outcome } from './msg'

// -------------------------------------------------------------------------------------
// Креирање артикла — шемом, али са формом која се пише на једном месту
// -------------------------------------------------------------------------------------
//
// Читати упоредо са `../kreiranje-shema/index.tsx` (исти приступ, форма разбијена на три
// места и combo стање на екрану) и са `../kreiranje/index.tsx` (исти облик декларације,
// друга провера).

export type Model = {
  readonly form: FormModel
  readonly isSubmitting: boolean
  readonly error: Option.Option<ApiError>
}

export type Result = [Model, Cmd.Cmd<Msg>, Outcome]

export const init: [Model, Cmd.Cmd<Msg>] = [{ form: form.init, isSubmitting: false, error: Option.none() }, Cmd.none]

const toCmd = (value: Payload<Fields>): Api.KreirajArtikalCmd => ({
  sifra: value.sifra,
  naziv: value.naziv,
  skraceniNaziv: value.skraceniNaziv,
  jedinicaMereID: value.jedinicaMere.id,
  grupaArtiklaID: value.grupaArtikla.id,
  kolicinaUJediniciMere: value.kolicinaUJediniciMere,
})

const kreiraj = (value: Payload<Fields>): Cmd.Cmd<Msg> =>
  Http.send(Api.kreirajArtikal(toCmd(value)), {
    onSuccess: saved,
    onError: error => saveFailed(mapHttpError(error)),
  })

export const update = (msg: Msg, model: Model): Result =>
  Msg.$match(msg, {
    // Једна грана за целу форму — и за текстуална поља и за оба комбоа.
    Form: ({ msg: poruka }): Result => {
      const [sledeca, cmd] = form.update(poruka, model.form)
      return [{ ...model, form: sledeca, error: Option.none() }, Cmd.map(formMsg)(cmd), active()]
    },

    Submitted: (): Result => {
      if (model.isSubmitting) return [model, Cmd.none, active()]
      const [sledeca, vrednost] = form.submit(model.form)
      if (Option.isNone(vrednost)) return [{ ...model, form: sledeca }, Cmd.none, active()]
      return [{ ...model, form: sledeca, isSubmitting: true, error: Option.none() }, kreiraj(vrednost.value), active()]
    },

    Saved: ({ identifikator }): Result => [{ ...model, isSubmitting: false }, Cmd.none, success(identifikator)],

    SaveFailed: ({ error }): Result => [
      { ...model, isSubmitting: false, error: Option.some(error) },
      Cmd.none,
      active(),
    ],

    Closed: (): Result => [model, Cmd.none, cancelled()],
  })

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => (
    <FormDialog
      title={t(S.artikal.kreiranje)}
      submitLabel={t(S.opste.sacuvaj)}
      isSubmitting={model.isSubmitting}
      dirty={isDirty(model)}
      onSubmit={() => dispatch(submitted())}
      onClose={() => dispatch(closed())}
    >
      {form.render(model.form, layout, { disabled: model.isSubmitting })(m => dispatch(formMsg(m)))}
      {Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
    </FormDialog>
  )

/** Да ли је корисник нешто унео — за упозорење при затварању. */
export const isDirty = (model: Model): boolean => form.isDirty(model.form)
