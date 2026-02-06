import {
  Card,
  CardHeader,
  Title1,
  Field,
  Input,
  Button,
  MessageBar,
  MessageBarBody,
  tokens,
} from '@fluentui/react-components'
import { Either, Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Task from 'tea-effect/Task'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Api from '../auth/api'
import type { Model } from './model'
import { Msg, usernameChanged, passwordChanged, submit, loginCompleted } from './msg'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

export const init: [Model, Cmd.Cmd<Msg>] = [
  {
    username: '',
    password: '',
    isSubmitting: false,
    error: Option.none(),
    result: Option.none(),
  },
  Cmd.none,
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    UsernameChanged: ({ username }): [Model, Cmd.Cmd<Msg>] => [{ ...model, username, error: Option.none() }, Cmd.none],
    PasswordChanged: ({ password }): [Model, Cmd.Cmd<Msg>] => [{ ...model, password, error: Option.none() }, Cmd.none],
    Submit: (): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isSubmitting: true, error: Option.none() },
      Task.attempt(loginCompleted)(Api.login({ username: model.username, password: model.password })),
    ],
    LoginCompleted: ({ result }): [Model, Cmd.Cmd<Msg>] =>
      Either.match(result, {
        onLeft: (error): [Model, Cmd.Cmd<Msg>] => [
          { ...model, isSubmitting: false, error: Option.some(error) },
          Cmd.none,
        ],
        onRight: (session): [Model, Cmd.Cmd<Msg>] => [
          { ...model, isSubmitting: false, result: Option.some(session) },
          Cmd.none,
        ],
      }),
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Card style={{ width: 400, padding: tokens.spacingHorizontalXXL }}>
        <CardHeader header={<Title1>Login</Title1>} />
        <form
          onSubmit={e => {
            e.preventDefault()
            dispatch(submit())
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}
        >
          <Field label="Username">
            <Input
              value={model.username}
              onChange={(_e, data) => dispatch(usernameChanged(data.value))}
              disabled={model.isSubmitting}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={model.password}
              onChange={(_e, data) => dispatch(passwordChanged(data.value))}
              disabled={model.isSubmitting}
            />
          </Field>
          {Option.isSome(model.error) && (
            <MessageBar intent="error">
              <MessageBarBody>Invalid username or password</MessageBarBody>
            </MessageBar>
          )}
          <Button
            appearance="primary"
            type="submit"
            disabled={model.isSubmitting || !model.username || !model.password}
          >
            {model.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
