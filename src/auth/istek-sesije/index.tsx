import { Button, Dialog, DialogActions, DialogBody, DialogSurface, DialogTitle, Text } from '@fluentui/react-components'
import { Effect, Option, Schedule, Stream } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Sub from 'tea-effect/Sub'
import type { Session } from '../session'
import { initial, preostalo, upozorava, upozorenje, type Model } from './model'
import { Msg, odjava, otkucaj } from './msg'

export * from './model'
export * from './msg'

const OTKUCAJ = '10 seconds'

export const init: [Model, Cmd.Cmd<Msg>] = [initial, Cmd.none]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Otkucaj: ({ sada }): [Model, Cmd.Cmd<Msg>] => [{ sada: Option.some(sada) }, Cmd.none],
    Odjava: (): [Model, Cmd.Cmd<Msg>] => [model, Cmd.none],
  })

export const subscriptions = (): Sub.Sub<Msg> =>
  Sub.withKey(
    'istek-sesije',
    Stream.repeatEffectWithSchedule(
      Effect.clockWith(clock => Effect.map(clock.currentTimeMillis, otkucaj)),
      Schedule.fixed(OTKUCAJ),
    ),
  )

const UpozorenjeView = ({ sekundi, dispatch }: { sekundi: number; dispatch: Platform.Dispatch<Msg> }) => (
  <Dialog open modalType="non-modal">
    <DialogSurface backdrop={{ appearance: 'dimmed' }}>
      <DialogBody>
        <DialogTitle action={null}>{upozorenje(sekundi)}</DialogTitle>

        <Text>Kada sesija istekne bicete odjavljeni i vratice vas na prijavu.</Text>

        <DialogActions>
          <Button appearance="secondary" onClick={() => dispatch(odjava())}>
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
    Option.match(preostalo(session, model), {
      onNone: () => null,
      onSome: sekundi => (upozorava(sekundi) ? <UpozorenjeView sekundi={sekundi} dispatch={dispatch} /> : null),
    })
