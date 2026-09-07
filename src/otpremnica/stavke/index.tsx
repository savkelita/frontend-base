import { Option, Data } from 'effect'
import {
  Title1,
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  MessageBar,
  MessageBarBody,
  tokens,
  makeStyles,
} from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { ObjekatIdentifikator } from '../../common/api'
import * as Create from './create'

// -------------------------------------------------------------------------------------
// Stavke otpremnice — host koji drži dijalog za dodavanje stavke
// -------------------------------------------------------------------------------------
//
// Namerno tanak host: postoji da pokaže kako se feature za kreiranje presavija nazad. Stavke
// koje prikazuje su one kreirane u ovoj sesiji, uzete pravo iz ishoda — zato ishod i nosi
// kreiranu stavku, a ne samo oznaku.

export type Msg = Data.TaggedEnum<{
  RequestCreate: {}
  CreateMsg: { readonly msg: Create.Msg }
}>

export const Msg = Data.taggedEnum<Msg>()

export const requestCreate = (): Msg => Msg.RequestCreate()
export const createMsg = (msg: Create.Msg): Msg => Msg.CreateMsg({ msg })

export type Model = {
  readonly ctx: Create.Context
  readonly stavke: ReadonlyArray<ObjekatIdentifikator>
  readonly creating: Option.Option<Create.Model>
}

export const init = (ctx: Create.Context): [Model, Cmd.Cmd<Msg>] => [
  { ctx, stavke: [], creating: Option.none() },
  Cmd.none,
]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    RequestCreate: (): [Model, Cmd.Cmd<Msg>] => {
      const [createModel, cmd] = Create.init(model.ctx)
      return [{ ...model, creating: Option.some(createModel) }, Cmd.map(createMsg)(cmd)]
    },

    // Presavij ishod: snimljena stavka ulazi u listu i zatvara dijalog, odustajanje samo zatvara.
    CreateMsg: ({ msg: createMessage }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.creating)) return [model, Cmd.none]
      const [createModel, cmd, outcome] = Create.update(model.ctx, createMessage, model.creating.value)
      return Create.Outcome.$match(outcome, {
        Active: (): [Model, Cmd.Cmd<Msg>] => [
          { ...model, creating: Option.some(createModel) },
          Cmd.map(createMsg)(cmd),
        ],
        Success: ({ identifikator }): [Model, Cmd.Cmd<Msg>] => [
          { ...model, creating: Option.none(), stavke: [...model.stavke, identifikator] },
          Cmd.none,
        ],
        Cancel: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, creating: Option.none() }, Cmd.none],
      })
    },
  })

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
})

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <StavkeView model={model} dispatch={dispatch} />

const StavkeView = ({ model, dispatch }: { readonly model: Model; readonly dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title1>Stavke otpremnice {model.ctx.otpremnicaID}</Title1>
        <Button appearance="primary" icon={<AddRegular />} onClick={() => dispatch(requestCreate())}>
          Dodaj stavku
        </Button>
      </div>
      {model.stavke.length === 0 ? (
        <MessageBar>
          <MessageBarBody>Otpremnica još nema stavki.</MessageBarBody>
        </MessageBar>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>ID stavke</TableHeaderCell>
              <TableHeaderCell>Verzija</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.stavke.map(stavka => (
              <TableRow key={stavka.id}>
                <TableCell>{stavka.id}</TableCell>
                <TableCell>{stavka.version}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {Option.isSome(model.creating) && Html.map(createMsg)(Create.view(model.ctx, model.creating.value))(dispatch)}
    </div>
  )
}
