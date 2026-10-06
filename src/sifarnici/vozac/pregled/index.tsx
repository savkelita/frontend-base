import { Body1, Button, Caption1, Card, Spinner, Title3, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, OpenRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import * as Router from 'tea-effect/Router'
import { hasAllFunkcionalnosti, type AuthorizationConfig, type Funkcionalnost } from '../../../auth/types'
import { mapHttpError, reportError } from '../../../common/error'
import { ErrorView } from '../../../common/error/view'
import * as Api from '../../api'
import type { VozacInfo } from '../../api'
import * as StanjeVozaca from '../../domain/stanje-vozaca'
import { Model } from './model'
import { Msg, receiveFailed, received, retry, vozilaMsg } from './msg'
import * as Vozila from './vozila'

export type { Model }
export type { Msg }

export const route = Router.path('/sifarnici/vozaci/:id', { id: Router.IntFromString }).end()

export const FUNKCIONALNOSTI: ReadonlyArray<Funkcionalnost> = ['PretragaVozaca']

const isAuthorized = (config: AuthorizationConfig): boolean => hasAllFunkcionalnosti(config, FUNKCIONALNOSTI)

export const url = (id: number): string => Router.format(route, { id })

export const button =
  <M,>(config: AuthorizationConfig, start: (id: number) => M, id: number | undefined): TeaReact.Html<M> =>
  (dispatch: Platform.Dispatch<M>) =>
    isAuthorized(config) && id !== undefined ? (
      <Button icon={<OpenRegular />} onClick={() => dispatch(start(id))}>
        Otvori
      </Button>
    ) : null

const load = (id: number): Cmd.Cmd<Msg> =>
  Http.send(Api.dajVozac(id), { onSuccess: received, onError: error => receiveFailed(mapHttpError(error)) })

export const init = (params: { readonly id: number }): [Model, Cmd.Cmd<Msg>] => [
  Model.Loading({ id: params.id }),
  load(params.id),
]

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    Received: ({ vozac }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag === 'Ready') return [model, Cmd.none]
      const [vozila, vozilaCmd] = Vozila.init(vozac.id)
      return [Model.Ready({ vozac, vozila }), Cmd.map(vozilaMsg)(vozilaCmd)]
    },

    ReceiveFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag === 'Ready') return [model, Cmd.none]
      return [Model.Failed({ id: model.id, error }), Cmd.none]
    },

    Retry: (): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Failed') return [model, Cmd.none]
      return [Model.Loading({ id: model.id }), load(model.id)]
    },

    VozilaMsg: ({ msg: msgVozila }): [Model, Cmd.Cmd<Msg>] => {
      if (model._tag !== 'Ready') return [model, Cmd.none]
      const [vozila, cmd] = Vozila.update(msgVozila, model.vozila)
      return [Model.Ready({ ...model, vozila }), Cmd.map(vozilaMsg)(cmd)]
    },
  })

const useStyles = makeStyles({
  ekran: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
    minHeight: '100%',
  },
  zaglavlje: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    flexShrink: 0,
  },
  podatak: {
    display: 'flex',
    flexDirection: 'column',
  },
  poruka: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
})

const Podatak = ({ oznaka, vrednost }: { oznaka: string; vrednost: string }) => {
  const styles = useStyles()
  return (
    <div className={styles.podatak}>
      <Body1>{vrednost === '' ? '-' : vrednost}</Body1>
      <Caption1>{oznaka}</Caption1>
    </div>
  )
}

const Zaglavlje = ({ vozac }: { vozac: VozacInfo }) => {
  const styles = useStyles()
  return (
    <Card className={styles.zaglavlje}>
      <Title3>{vozac.imeZaPrikaz}</Title3>
      <Podatak oznaka="E-mail" vrednost={vozac.email ?? ''} />
      <Podatak oznaka="Telefon" vrednost={vozac.telefon ?? ''} />
      <Podatak oznaka="Kategorije" vrednost={vozac.kategorije.map(k => k.oznaka).join(', ')} />
      <Podatak oznaka="Stanje" vrednost={StanjeVozaca.text(vozac.stanje)} />
    </Card>
  )
}

const PregledView = ({ model, dispatch }: { model: Model; dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()

  return (
    <div className={styles.ekran}>
      {Model.$match(model, {
        Loading: () => (
          <div className={styles.poruka}>
            <Spinner size="small" labelPosition="below" label="Preuzimam podatke..." />
          </div>
        ),
        Failed: ({ error }) => (
          <ErrorView
            report={reportError(error)}
            actions={
              <Button icon={<ArrowClockwiseRegular />} onClick={() => dispatch(retry())}>
                Pokusaj ponovo
              </Button>
            }
          />
        ),
        Ready: ({ vozac, vozila }) => (
          <>
            <Zaglavlje vozac={vozac} />
            {Html.map(vozilaMsg)(Vozila.view(vozila))(dispatch)}
          </>
        ),
      })}
    </div>
  )
}

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PregledView model={model} dispatch={dispatch} />
