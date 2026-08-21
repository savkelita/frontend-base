import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { hasAllFunkcionalnosti, type AuthorizationConfig, type Funkcionalnost } from '../../../auth/types'
import * as Combo from '../../../common/domain/combo'
import { mapHttpError, reportError } from '../../../common/error'
import { ErrorView } from '../../../common/error/view'
import * as Form from '../../../common/form'
import { FormDialog } from '../../../common/form/dialog'
import * as Api from '../../api'
import * as Kategorija from '../../domain/kategorija-vozaca'
import { EMPTY, sameForm, vForm, type FormValue, type Model, type Value } from './model'
import { Msg, changed, closed, kategorijeMsg, saveFailed, saved, submitted } from './msg'

export * from './model'
export * from './msg'

const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['KreiranjeVozaca']

const isAuthorized = (config: AuthorizationConfig): boolean => hasAllFunkcionalnosti(config, FUNKCIONALNOSTI)

export const button =
  <M,>(config: AuthorizationConfig, start: M): TeaReact.Html<M> =>
  (dispatch: Platform.Dispatch<M>) =>
    isAuthorized(config) ? (
      <Button appearance="primary" icon={<AddRegular />} onClick={() => dispatch(start)}>
        Novi vozac
      </Button>
    ) : null

export const init: [Model, Cmd.Cmd<Msg>] = [
  {
    value: EMPTY,
    showErrors: false,
    isSubmitting: false,
    error: Option.none(),
    kategorijeCombo: Combo.empty<Kategorija.Value>(),
  },
  Cmd.none,
]

export const toCmd = (value: Value): Api.KreirajVozacCmd => ({
  ime: value.ime,
  prezime: value.prezime,
  imeZaPrikaz: value.imeZaPrikaz,
  email: value.email,
  telefon: value.telefon,
  kategorije: value.kategorije.map(Kategorija.id),
})

const kreiraj = (value: Value): Cmd.Cmd<Msg> =>
  Http.send(Api.kreirajVozac(toCmd(value)), {
    onSuccess: identifikator => saved(identifikator),
    onError: error => saveFailed(mapHttpError(error)),
  })

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Changed: ({ value }): [Model, Cmd.Cmd<Msg>] => [{ ...model, value, error: Option.none() }, Cmd.none],

    Submitted: (): [Model, Cmd.Cmd<Msg>] => {
      if (model.isSubmitting) return [model, Cmd.none]
      const result = Form.validate(vForm, model.value)
      if (!result.isValid) return [{ ...model, showErrors: true }, Cmd.none]
      return [{ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, kreiraj(result.value)]
    },

    Saved: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, isSubmitting: false }, Cmd.none],

    SaveFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isSubmitting: false, error: Option.some(error) },
      Cmd.none,
    ],

    Closed: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],

    KategorijeMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      const [kategorijeCombo, comboCmd] = Combo.update(Kategorija.search, comboMessage, model.kategorijeCombo)
      const value = comboMessage._tag === 'Selected' ? { ...model.value, kategorije: comboMessage.values } : model.value
      return [{ ...model, kategorijeCombo, value }, Cmd.map(kategorijeMsg)(comboCmd)]
    },
  })

const useStyles = makeStyles({
  fields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  red: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
  },
  polje: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
  },
})

const options = (
  styles: ReturnType<typeof useStyles>,
  model: Model,
  dispatch: Platform.Dispatch<Msg>,
): Form.Options<FormValue> => ({
  template: locals => (
    <div className={styles.fields}>
      <div className={styles.red}>
        <div className={styles.polje}>{locals.inputs.ime}</div>
        <div className={styles.polje}>{locals.inputs.prezime}</div>
      </div>
      {locals.inputs.imeZaPrikaz}
      <div className={styles.red}>
        <div className={styles.polje}>{locals.inputs.email}</div>
        <div className={styles.polje}>{locals.inputs.telefon}</div>
      </div>
      {locals.inputs.kategorije}
    </div>
  ),
  fields: {
    ime: { label: 'Ime', autoFocus: true },
    prezime: { label: 'Prezime' },
    imeZaPrikaz: { label: 'Ime za prikaz' },
    email: { label: 'E-mail', type: 'email' },
    telefon: { label: 'Telefon' },
    kategorije: {
      label: 'Kategorije',
      placeholder: 'Izaberite kategorije',
      model: model.kategorijeCombo,
      onMsg: (msg: Combo.Msg<Kategorija.Value>) => dispatch(kategorijeMsg(msg)),
    },
  },
})

const KreiranjeView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()

  return (
    <FormDialog
      title="Kreiranje vozaca"
      submitLabel="Sacuvaj"
      isSubmitting={model.isSubmitting}
      dirty={!sameForm(EMPTY, model.value)}
      onSubmit={() => dispatch(submitted())}
      onClose={() => dispatch(closed())}
    >
      {Form.render({
        schema: vForm(),
        value: model.value,
        onChange: value => dispatch(changed(value)),
        options: options(styles, model, dispatch),
        issues: Form.visibleIssues(vForm, model.value, model.showErrors),
        ctx: { disabled: model.isSubmitting },
      })}
      {Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
    </FormDialog>
  )
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <KreiranjeView model={model} dispatch={dispatch} />
