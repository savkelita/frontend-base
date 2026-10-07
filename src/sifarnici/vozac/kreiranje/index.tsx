import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { hasAllPermissions, type AuthorizationConfig, type Permission } from '../../../auth/types'
import * as Combo from '../../../common/domain/combo'
import { mapHttpError, reportError } from '../../../common/error'
import { ErrorView } from '../../../common/error/view'
import * as Form from '../../../common/form'
import { FormDialog } from '../../../common/form/dialog'
import { active, cancelled, done, type UpdateResult } from '../../../common/form/result'
import type { ObjekatIdentifikator } from '../../../common/http/identifikator'
import * as Api from '../../api'
import * as Kategorija from '../../domain/kategorija-vozaca'
import { EMPTY, isDirty, vForm, type FormValue, type Model, type Value } from './model'
import { Msg, changed, closed, kategorijeMsg, saveFailed, saved, submitted } from './msg'

export * from './model'
export * from './msg'

const PERMISSIONS: ReadonlyArray<Permission> = ['KreiranjeVozaca']

const isAuthorized = (config: AuthorizationConfig): boolean => hasAllPermissions(config, PERMISSIONS)

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

export type Result = UpdateResult<Model, Msg, ObjekatIdentifikator>

export const update = (msg: Msg, model: Model): Result =>
  Msg.$match(msg, {
    Changed: ({ value }): Result => active({ ...model, value, error: Option.none() }),

    Submitted: (): Result => {
      if (model.isSubmitting) return active(model)
      const result = Form.validate(vForm, model.value)
      if (!result.isValid) return active({ ...model, showErrors: true })
      return active({ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, kreiraj(result.value))
    },

    Saved: ({ identifikator }): Result => done(identifikator),

    SaveFailed: ({ error }): Result => active({ ...model, isSubmitting: false, error: Option.some(error) }),

    Closed: (): Result => cancelled(),

    KategorijeMsg: ({ msg: comboMessage }): Result => {
      const [kategorijeCombo, comboCmd] = Combo.update(Kategorija.search, comboMessage, model.kategorijeCombo)
      const value = comboMessage._tag === 'Selected' ? { ...model.value, kategorije: comboMessage.values } : model.value
      return active({ ...model, kategorijeCombo, value }, Cmd.map(kategorijeMsg)(comboCmd))
    },
  })

const useStyles = makeStyles({
  fields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  row: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
  },
  field: {
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
      <div className={styles.row}>
        <div className={styles.field}>{locals.inputs.ime}</div>
        <div className={styles.field}>{locals.inputs.prezime}</div>
      </div>
      {locals.inputs.imeZaPrikaz}
      <div className={styles.row}>
        <div className={styles.field}>{locals.inputs.email}</div>
        <div className={styles.field}>{locals.inputs.telefon}</div>
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
      dirty={isDirty(model)}
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
