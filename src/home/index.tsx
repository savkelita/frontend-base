import { Title1, Text, Card, CardHeader, Button, tokens } from '@fluentui/react-components'
import { AddRegular, SubtractRegular, ArrowResetRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { Model } from './model'
import { Msg, increment, decrement, reset } from './msg'

export type { Model }
export type { Msg }

export const init: [Model, Cmd.Cmd<Msg>] = [{ count: 0 }, Cmd.none]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Increment: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, count: model.count + 1 }, Cmd.none],
    Decrement: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, count: model.count - 1 }, Cmd.none],
    Reset: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, count: 0 }, Cmd.none],
  })

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => (
    <Card>
      <CardHeader header={<Title1>Home</Title1>} />
      <Text>Welcome to the frontend-base scaffold using the tea-effect architecture.</Text>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacingHorizontalM,
          marginTop: tokens.spacingVerticalM,
        }}
      >
        <Button icon={<SubtractRegular />} onClick={() => dispatch(decrement())} />
        <Text size={500} weight="semibold">
          {model.count}
        </Text>
        <Button icon={<AddRegular />} onClick={() => dispatch(increment())} />
        <Button icon={<ArrowResetRegular />} appearance="subtle" onClick={() => dispatch(reset())} />
      </div>
    </Card>
  )
