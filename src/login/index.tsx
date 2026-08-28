import { Button, Card, CardHeader, Spinner, Title1, makeStyles, tokens } from '@fluentui/react-components'
import { Effect, Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Api from '../auth/api'
import type * as Uloga from '../auth/domain/uloga'
import { fromLoginResponse } from '../auth/session'
import { mapHttpError, reportError } from '../common/error'
import { ErrorView } from '../common/error/view'
import * as Form from '../common/form'
import {
  Step,
  initial,
  initialUloga,
  vFormKorisnik,
  vFormUloga,
  type FormKorisnik,
  type FormUloga,
  type Model,
} from './model'
import {
  Msg,
  changeKorisnik,
  changeUloga,
  identified,
  identifyFailed,
  loginFailed,
  loginSucceeded,
  submitKorisnik,
  submitUloga,
} from './msg'

export type { Model }
export type { Msg }

export const init: [Model, Cmd.Cmd<Msg>] = [initial, Cmd.none]

const identifikuj = (cmd: Api.IdentifikujCmd): Cmd.Cmd<Msg> =>
  Http.send(Api.identifikuj(cmd), {
    onSuccess: response => identified(response.uloge),
    onError: error => identifyFailed(mapHttpError(error)),
  })

const prijavi = (uloga: Uloga.Value): Cmd.Cmd<Msg> =>
  Cmd.fromEffect(
    Effect.match(
      Effect.zip(
        Http.toTask(Api.login(uloga)),
        Effect.clockWith(clock => clock.currentTimeMillis),
      ),
      {
        onFailure: error => loginFailed(mapHttpError(error)),
        onSuccess: ([response, clientIssued]) => loginSucceeded(fromLoginResponse(response, uloga, clientIssued)),
      },
    ),
  )

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    ChangeKorisnik: ({ value }): [Model, Cmd.Cmd<Msg>] => {
      if (model.step._tag !== 'Korisnik') return [model, Cmd.none]
      return [{ ...model, step: Step.Korisnik({ form: value }), error: Option.none() }, Cmd.none]
    },

    SubmitKorisnik: (): [Model, Cmd.Cmd<Msg>] => {
      if (model.step._tag !== 'Korisnik') return [model, Cmd.none]
      const result = Form.validate(vFormKorisnik, model.step.form)
      if (!result.isValid) return [{ ...model, showErrors: true }, Cmd.none]
      return [{ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, identifikuj(result.value)]
    },

    Identified: ({ uloge }): [Model, Cmd.Cmd<Msg>] => {
      const [value] = uloge
      if (uloge.length === 1) return [model, prijavi(value)]
      return [
        {
          ...model,
          step: Step.Uloga({ form: initialUloga, uloge }),
          showErrors: false,
          isSubmitting: false,
          error: Option.none(),
        },
        Cmd.none,
      ]
    },

    IdentifyFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isSubmitting: false, error: Option.some(error) },
      Cmd.none,
    ],

    ChangeUloga: ({ value }): [Model, Cmd.Cmd<Msg>] => {
      if (model.step._tag !== 'Uloga') return [model, Cmd.none]
      return [{ ...model, step: Step.Uloga({ ...model.step, form: value }), error: Option.none() }, Cmd.none]
    },

    SubmitUloga: (): [Model, Cmd.Cmd<Msg>] => {
      if (model.step._tag !== 'Uloga') return [model, Cmd.none]
      const result = Form.validate(vFormUloga(model.step.uloge), model.step.form)
      if (!result.isValid) return [{ ...model, showErrors: true }, Cmd.none]
      return [{ ...model, showErrors: true, isSubmitting: true, error: Option.none() }, prijavi(result.value.uloga)]
    },

    LoginSucceeded: ({ session }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isSubmitting: false, result: Option.some(session) },
      Cmd.none,
    ],

    LoginFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isSubmitting: false, error: Option.some(error) },
      Cmd.none,
    ],
  })

const useStyles = makeStyles({
  screen: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  card: {
    width: '400px',
    padding: tokens.spacingHorizontalXXL,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

const korisnikOptions = (stack: string): Form.Options<FormKorisnik> => ({
  template: locals => (
    <div className={stack}>
      {locals.inputs.korisnickoIme}
      {locals.inputs.lozinka}
    </div>
  ),
  fields: {
    korisnickoIme: { label: 'Korisnicko ime', autoComplete: 'username', autoFocus: true },
    lozinka: { label: 'Lozinka', type: 'password', autoComplete: 'current-password' },
  },
})

const ulogaOptions: Form.Options<FormUloga> = {
  template: locals => locals.inputs.uloga,
  fields: {
    uloga: { label: 'Uloga', placeholder: 'Izaberite ulogu' },
  },
}

const LoginView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()
  const naslov = model.step._tag === 'Korisnik' ? 'Prijava' : 'Izbor uloge'

  const form =
    model.step._tag === 'Korisnik'
      ? Form.render({
          schema: vFormKorisnik(),
          value: model.step.form,
          onChange: value => dispatch(changeKorisnik(value)),
          options: korisnikOptions(styles.stack),
          issues: Form.visibleIssues(vFormKorisnik, model.step.form, model.showErrors),
          ctx: { disabled: model.isSubmitting },
        })
      : Form.render({
          schema: vFormUloga(model.step.uloge)(),
          value: model.step.form,
          onChange: value => dispatch(changeUloga(value)),
          options: ulogaOptions,
          issues: Form.visibleIssues(vFormUloga(model.step.uloge), model.step.form, model.showErrors),
          ctx: { disabled: model.isSubmitting },
        })

  return (
    <div className={styles.screen}>
      <Card className={styles.card}>
        <CardHeader header={<Title1>{naslov}</Title1>} />
        <form
          noValidate
          className={styles.stack}
          onSubmit={e => {
            e.preventDefault()
            dispatch(model.step._tag === 'Korisnik' ? submitKorisnik() : submitUloga())
          }}
        >
          {form}
          {Option.isSome(model.error) && <ErrorView report={reportError(model.error.value)} />}
          <Button appearance="primary" type="submit" disabled={model.isSubmitting}>
            {model.isSubmitting ? <Spinner size="extra-small" /> : 'Prijavi se'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <LoginView model={model} dispatch={dispatch} />
