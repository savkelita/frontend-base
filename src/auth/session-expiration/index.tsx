import { Button, Dialog, DialogActions, DialogBody, DialogSurface, DialogTitle, Text } from '@fluentui/react-components'
import { Effect, Option, Schedule, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Sub from 'tea-effect/Sub'
import type { Session } from '../session'
import { initial, remaining, warning, warns, type Model } from './model'
import { Msg, signOut, tick } from './msg'

export * from './model'
export * from './msg'

const INTERVAL = '10 seconds'

export const init: [Model, Cmd.Cmd<Msg>] = [initial, Cmd.none]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Tick: ({ now }): [Model, Cmd.Cmd<Msg>] => [{ now: Option.some(now) }, Cmd.none],
    SignOut: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],
  })

export const subscriptions = (): Sub.Sub<Msg> =>
  Sub.withKey(
    'session-expiration',
    Stream.repeatEffectWithSchedule(
      Effect.clockWith(clock => Effect.map(clock.currentTimeMillis, tick)),
      Schedule.fixed(INTERVAL),
    ),
  )

const WarningView = ({ seconds, dispatch }: { seconds: number; dispatch: Platform.Dispatch<Msg> }) => (
  <Dialog open modalType="non-modal">
    <DialogSurface backdrop={{ appearance: 'dimmed' }}>
      <DialogBody>
        <DialogTitle action={null}>{warning(seconds)}</DialogTitle>

        <Text>Kada sesija istekne bicete odjavljeni i vratice vas na prijavu.</Text>

        <DialogActions>
          <Button appearance="secondary" onClick={() => dispatch(signOut())}>
            Odjavi se
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
)

export const view =
  (session: Session, model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) =>
    Option.match(remaining(session, model), {
      onNone: () => null,
      onSome: seconds => (warns(seconds) ? <WarningView seconds={seconds} dispatch={dispatch} /> : null),
    })
