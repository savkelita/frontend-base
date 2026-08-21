import { Button, Spinner, makeStyles, tokens } from '@fluentui/react-components'
import { EditRegular } from '@fluentui/react-icons'
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
import type { VozacInfo } from '../../api'
import * as Kategorija from '../../domain/kategorija-vozaca'
import { Model, sameForm, toForm, vForm, type FormValue, type Value } from './model'
import { Msg, changed, closed, kategorijeMsg, receiveFailed, received, saveFailed, saved, submitted } from './msg'

export * from './model'
export * from './msg'

const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['AzuriranjeVozaca']

const isAuthorized = (config: AuthorizationConfig): boolean => hasAllFunkcionalnosti(config, FUNKCIONALNOSTI)

export const button =
  <M,>(config: AuthorizationConfig, start: (id: number) => M, id: number | undefined): TeaReact.Html<M> =>
  (dispatch: Platform.Dispatch<M>) =>
    isAuthorized(config) && id !== undefined ? (
      <Button icon={<EditRegular />} onClick={() => dispatch(start(id))}>
        Izmeni
      </Button>
    ) : null

export const init = (id: number): [Model, Cmd.Cmd<Msg>] => [
  Model.Loading(),
  Http.send(Api.dajVozac(id), { onSuccess: received, onError: error => receiveFailed(mapHttpError(error)) }),
]

export const toCmd = (original: VozacInfo, value: Value): Api.AzurirajVozacCmd => ({
  id: original.id,
  version: original.version,
  ime: value.ime,
  prezime: value.prezime,
  imeZaPrikaz: value.imeZaPrikaz,
  email: value.email,
  telefon: value.telefon,
  stanje: value.stanje,
  kategorije: value.kategorije.map(Kategorija.id),
})

const azuriraj = (original: VozacInfo, value: Value): Cmd.Cmd<Msg> =>
  Http.send(Api.azurirajVozac(toCmd(original, value)), {
    onSuccess: () => saved(),
    onError: error => saveFailed(mapHttpError(error)),
  })

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Received: ({ vozac }): [Model, Cmd.Cmd<Msg>] => [
      Model.Ready({
        original: vozac,
        value: toForm(vozac),
        showErrors: false,
        isSubmitting: false,
        error: Option.none(),
        kategorijeCombo: Combo.empty<Kategorija.Value>(),
      }),
      Cmd.none,
    ],

    ReceiveFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [Model.Failed({ error }), Cmd.none],

    Changed: ({ value }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready') return [model, Cmd.none]
      return [Model.Ready({ ...model, value, error: Option.none() }), Cmd.none]
    },

    Submitted: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready' || model.isSubmitting) return [model, Cmd.none]
      const result = Form.validate(vForm, model.value)
      if (!result.isValid) return [Model.Ready({ ...model, showErrors: true }), Cmd.none]
      return [
        Model.Ready({ ...model, showErrors: true, isSubmitting: true, error: Option.none() }),
        azuriraj(model.original, result.value),
      ]
    },

    Saved: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready') return [model, Cmd.none]
      return [Model.Ready({ ...model, isSubmitting: false }), Cmd.none]
    },

    SaveFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready') return [model, Cmd.none]
      return [Model.Ready({ ...model, isSubmitting: false, error: Option.some(error) }), Cmd.none]
    },

    Closed: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],

    KategorijeMsg: ({ msg: comboMessage }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready') return [model, Cmd.none]
      const [kategorijeCombo, comboCmd] = Combo.update(Kategorija.search, comboMessage, model.kategorijeCombo)
      const value = comboMessage._tag === 'Selected' ? { ...model.value, kategorije: comboMessage.values } : model.value
      return [Model.Ready({ ...model, kategorijeCombo, value }), Cmd.map(kategorijeMsg)(comboCmd)]
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
  poruka: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
})

const options = (
  styles: ReturnType<typeof useStyles>,
  kategorijeCombo: Combo.Model<Kategorija.Value>,
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
      {locals.inputs.stanje}
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
      model: kategorijeCombo,
      onMsg: (msg: Combo.Msg<Kategorija.Value>) => dispatch(kategorijeMsg(msg)),
    },
    stanje: { label: 'Stanje' },
  },
})

const AzuriranjeView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()
  const izmenjeno = model._tag === 'Ready' && !sameForm(toForm(model.original), model.value)

  return (
    <>
      <FormDialog
        title="Izmena vozaca"
        submitLabel="Sacuvaj"
        isSubmitting={model._tag === 'Ready' && model.isSubmitting}
        submitDisabled={!izmenjeno}
        dirty={izmenjeno}
        onSubmit={() => dispatch(submitted())}
        onClose={() => dispatch(closed())}
      >
        {Model.$match(model, {
          Loading: () => (
            <div className={styles.poruka}>
              <Spinner size="small" labelPosition="below" label="Preuzimam podatke..." />
            </div>
          ),
          Failed: ({ error }) => <ErrorView report={reportError(error)} />,
          Ready: m => (
            <>
              {Form.render({
                schema: vForm(),
                value: m.value,
                onChange: value => dispatch(changed(value)),
                options: options(styles, m.kategorijeCombo, dispatch),
                issues: Form.visibleIssues(vForm, m.value, m.showErrors),
                ctx: { disabled: m.isSubmitting },
              })}
              {Option.isSome(m.error) && <ErrorView report={reportError(m.error.value)} />}
            </>
          ),
        })}
      </FormDialog>
    </>
  )
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <AzuriranjeView model={model} dispatch={dispatch} />
