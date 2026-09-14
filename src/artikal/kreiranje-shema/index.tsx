import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Api from '../api'
import { Stack } from '../../common/components/layout'
import * as ComboDomain from '../../common/shema/domain/combo'
import { mapHttpError, reportError } from '../../common/shema/error'
import { ErrorView } from '../../common/shema/error/view'
import * as ShemaForma from '../../common/shema/form'
import { FormDialog } from '../../common/shema/form/dialog'
import { S, t } from '../../common/strings'
import { pretraziGrupaArtiklaCombo, pretraziJedinicaMereCombo, type JedinicaMere } from './api'
import { EMPTY, sameForm, vForm, type FormValue, type Model, type Value } from './model'
import {
  Msg,
  Outcome,
  active,
  cancelled,
  changed,
  closed,
  grupaArtiklaMsg,
  jedinicaMereMsg,
  saveFailed,
  saved,
  submitted,
  success,
} from './msg'

export type { Model } from './model'
export { Msg, Outcome } from './msg'

// -------------------------------------------------------------------------------------
// Креирање артикла — шемом (за поређење са `../kreiranje`)
// -------------------------------------------------------------------------------------
//
// Исти екран, други приступ. Читати упоредо са `../kreiranje/index.tsx`.

export type Result = [Model, Cmd.Cmd<Msg>, Outcome]

export const init: [Model, Cmd.Cmd<Msg>] = [
  {
    value: EMPTY,
    showErrors: false,
    isSubmitting: false,
    error: Option.none(),
    jedinicaMereCombo: ComboDomain.empty<JedinicaMere>(),
    grupaArtiklaCombo: ComboDomain.empty<JedinicaMere>(),
  },
  Cmd.none,
]

const toCmd = (value: Value): Api.KreirajArtikalCmd => ({
  sifra: value.sifra,
  naziv: value.naziv,
  skraceniNaziv: value.skraceniNaziv,
  jedinicaMereID: value.jedinicaMere.id,
  grupaArtiklaID: value.grupaArtikla.id,
  kolicinaUJediniciMere: value.kolicinaUJediniciMere,
})

const kreiraj = (value: Value): Cmd.Cmd<Msg> =>
  Http.send(Api.kreirajArtikal(toCmd(value)), {
    onSuccess: saved,
    onError: error => saveFailed(mapHttpError(error)),
  })

export const update = (msg: Msg, model: Model): Result =>
  Msg.$match(msg, {
    Changed: ({ value }): Result => [{ ...model, value, error: Option.none() }, Cmd.none, active()],

    Submitted: (): Result => {
      if (model.isSubmitting) return [model, Cmd.none, active()]
      const result = ShemaForma.validate(vForm, model.value)
      if (!result.isValid) return [{ ...model, showErrors: true }, Cmd.none, active()]
      return [{ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, kreiraj(result.value), active()]
    },

    Saved: ({ identifikator }): Result => [{ ...model, isSubmitting: false }, Cmd.none, success(identifikator)],

    SaveFailed: ({ error }): Result => [
      { ...model, isSubmitting: false, error: Option.some(error) },
      Cmd.none,
      active(),
    ],

    Closed: (): Result => [model, Cmd.none, cancelled()],

    // Свако combo поље тражи своју грану, свој модел и своје пресликавање назад у вредност.
    JedinicaMereMsg: ({ msg: comboMsg }): Result => {
      const [vrednost, jedinicaMereCombo, cmd] = ComboDomain.step(
        pretraziJedinicaMereCombo,
        comboMsg,
        model.jedinicaMereCombo,
        model.value.jedinicaMere,
      )
      return [
        { ...model, jedinicaMereCombo, value: { ...model.value, jedinicaMere: vrednost } },
        Cmd.map(jedinicaMereMsg)(cmd),
        active(),
      ]
    },

    GrupaArtiklaMsg: ({ msg: comboMsg }): Result => {
      const [vrednost, grupaArtiklaCombo, cmd] = ComboDomain.step(
        pretraziGrupaArtiklaCombo,
        comboMsg,
        model.grupaArtiklaCombo,
        model.value.grupaArtikla,
      )
      return [
        { ...model, grupaArtiklaCombo, value: { ...model.value, grupaArtikla: vrednost } },
        Cmd.map(grupaArtiklaMsg)(cmd),
        active(),
      ]
    },
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

const options = (model: Model, dispatch: Platform.Dispatch<Msg>): ShemaForma.Options<FormValue> => ({
  template: locals => (
    <Stack vertical gap="m">
      {locals.inputs.sifra}
      {locals.inputs.naziv}
      {locals.inputs.skraceniNaziv}
      {locals.inputs.jedinicaMere}
      {locals.inputs.grupaArtikla}
      {locals.inputs.kolicinaUJediniciMere}
    </Stack>
  ),
  fields: {
    sifra: { label: t(S.artikal.sifra), autoFocus: true },
    naziv: { label: t(S.artikal.naziv) },
    skraceniNaziv: { label: t(S.artikal.skraceniNaziv) },
    jedinicaMere: {
      label: t(S.artikal.jedinicaMere),
      model: model.jedinicaMereCombo,
      onMsg: (msg: ComboDomain.Msg<JedinicaMere>) => dispatch(jedinicaMereMsg(msg)),
    },
    grupaArtikla: {
      label: t(S.artikal.grupaArtikla),
      model: model.grupaArtiklaCombo,
      onMsg: (msg: ComboDomain.Msg<JedinicaMere>) => dispatch(grupaArtiklaMsg(msg)),
    },
    kolicinaUJediniciMere: { label: t(S.artikal.kolicinaUJM) },
  },
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
      {ShemaForma.render({
        schema: vForm(),
        value: model.value,
        onChange: value => dispatch(changed(value)),
        options: options(model, dispatch),
        issues: ShemaForma.visibleIssues(vForm, model.value, model.showErrors),
        ctx: { disabled: model.isSubmitting },
      })}
      {Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
    </FormDialog>
  )

/** Да ли је корисник нешто унео — за упозорење при затварању. */
export const isDirty = (model: Model): boolean => !sameForm(EMPTY, model.value)
