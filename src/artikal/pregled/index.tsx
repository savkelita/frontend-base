import { Option } from 'effect'
import { Card, Link, MessageBar, MessageBarBody, Spinner, Title2, makeStyles, tokens } from '@fluentui/react-components'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import * as Navigation from 'tea-effect/Navigation'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Spacer, Stack, Toolbar } from '../../common/components/layout'
import { errorReport } from '../../common/platform'
import { S, t } from '../../common/strings'
import { putanja, routes } from '../../router/route'
import * as Api from '../api'
import * as Azuriranje from '../azuriranje'
import * as Brisanje from '../brisanje'
import { StanjeBadge } from '../domain/artikal-stanje'
import * as Pakovanja from '../pregled-svih'
import * as State from '../../common/state'
import type { Model } from './model'
import { Msg, azuriranje, brisanje, failed, loaded, pakovanja } from './msg'

export type { Model } from './model'
export type { Msg } from './msg'

// -------------------------------------------------------------------------------------
// Преглед артикла
// -------------------------------------------------------------------------------------
//
// Екран не зна шта радње раде. Свака доноси своје дугме (`Brisanje.button`), своје право
// и свој предуслов; преглед их само распореди и пресавије њихов исход. Кад се артикал
// обрише, овде — а не у брисању — стоји одлука куда се иде даље.

export type Authorization = Azuriranje.Authorization & Brisanje.Authorization

export const init = (artikalID: number): Result => [
  State.loading,
  Http.send(Api.dajArtikal({ artikalID }), { onSuccess: loaded, onError: failed }),
]

/** Шта `update` враћа — исти облик у свакој грани. */
export type Result = [Model, Cmd.Cmd<Msg>]

export const update = (msg: Msg, model: Model): Result => {
  const onLoaded = State.onLoaded(model, msg)

  return Msg.$match(msg, {
    Loaded: ({ original }): Result => {
      const [pakovanjaModel, cmd] = Pakovanja.init(original.id)
      return [
        State.loaded({
          original,
          azuriranje: Option.none(),
          brisanje: Option.none(),
          pakovanja: pakovanjaModel,
        }),
        Cmd.map(pakovanja)(cmd),
      ]
    },

    Failed: ({ error }): Result => [State.failed(errorReport(error).message), Cmd.none],

    StartAzuriranje: (): Result =>
      onLoaded(state => {
        const [azuriranjeModel, cmd] = Azuriranje.init(state.original.id)
        return [State.loaded({ ...state, azuriranje: Option.some(azuriranjeModel) }), Cmd.map(azuriranje)(cmd)]
      }),

    // Успешна измена не покушава да погоди нови запис — поново се учитава са сервера.
    Azuriranje: ({ msg: azuriranjeMsg }): Result =>
      onLoaded(state =>
        Option.match(state.azuriranje, {
          onNone: (): Result => [model, Cmd.none],
          onSome: (azuriranjeModel): Result => {
            const [sledeci, cmd, ishod] = Azuriranje.update(azuriranjeMsg, azuriranjeModel)
            return Azuriranje.Outcome.$match(ishod, {
              Active: (): Result => [
                State.loaded({ ...state, azuriranje: Option.some(sledeci) }),
                Cmd.map(azuriranje)(cmd),
              ],
              Success: (): Result => [
                State.loaded({ ...state, azuriranje: Option.none() }),
                Http.send(Api.dajArtikal({ artikalID: state.original.id }), {
                  onSuccess: loaded,
                  onError: failed,
                }),
              ],
              Cancel: (): Result => [State.loaded({ ...state, azuriranje: Option.none() }), Cmd.none],
            })
          },
        }),
      ),

    StartBrisanje: (): Result =>
      onLoaded(state => [State.loaded({ ...state, brisanje: Option.some(Brisanje.init) }), Cmd.none]),

    // Обрисан запис више нема свој екран: одлука куда се иде припада прегледу.
    Brisanje: ({ msg: brisanjeMsg }): Result =>
      onLoaded(state =>
        Option.match(state.brisanje, {
          onNone: (): Result => [model, Cmd.none],
          onSome: (brisanjeModel): Result => {
            const identifikator = { id: state.original.id, version: state.original.version }
            const [sledeci, cmd, ishod] = Brisanje.update(identifikator, brisanjeMsg, brisanjeModel)
            return Brisanje.Outcome.$match(ishod, {
              Active: (): Result => [
                State.loaded({ ...state, brisanje: Option.some(sledeci) }),
                Cmd.map(brisanje)(cmd),
              ],
              Success: (): Result => [model, Navigation.pushUrl(putanja(routes.artikli, {}))],
              Cancel: (): Result => [State.loaded({ ...state, brisanje: Option.none() }), Cmd.none],
            })
          },
        }),
      ),

    Pakovanja: ({ msg: pakovanjaMsg }): Result =>
      onLoaded(state => {
        const [pakovanjaModel, cmd] = Pakovanja.update(state.original.id, pakovanjaMsg, state.pakovanja)
        return [State.loaded({ ...state, pakovanja: pakovanjaModel }), Cmd.map(pakovanja)(cmd)]
      }),
  })
}

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

// Мрежа поља остаје CSS: то није ред ни колона него распоред који се прелама по ширини.
const useStyles = makeStyles({
  polja: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
  oznaka: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
})

const Polje = ({ oznaka, vrednost }: { readonly oznaka: string; readonly vrednost: string }) => {
  const styles = useStyles()
  return (
    <Stack vertical gap="xs">
      <span className={styles.oznaka}>{oznaka}</span>
      <span>{vrednost}</span>
    </Stack>
  )
}

export const view =
  (auth: Authorization, model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <PregledView auth={auth} model={model} dispatch={dispatch} />

const PregledView = ({
  auth,
  model,
  dispatch,
}: {
  readonly auth: Authorization
  readonly model: Model
  readonly dispatch: Platform.Dispatch<Msg>
}) => {
  const styles = useStyles()
  const stanje = State.valueOf(model)?.original.stanje ?? null

  if (model._tag === 'Loading') return <Spinner labelPosition="below" label={t(S.opste.ucitavanje)} />
  if (model._tag === 'Failed')
    return (
      <MessageBar intent="error">
        <MessageBarBody>{model.message}</MessageBarBody>
      </MessageBar>
    )

  const { original } = model.loaded

  return (
    <Stack vertical gap="l">
      <Stack align="center">
        <Title2>
          {original.sifra} — {original.naziv}
        </Title2>
        <StanjeBadge stanje={original.stanje} />
        <Spacer />
        <Toolbar>
          {Azuriranje.button(auth, stanje, Msg.StartAzuriranje(), dispatch)}
          {Brisanje.button(auth, stanje, Msg.StartBrisanje(), dispatch)}
          <Link appearance="subtle" href={putanja(routes.artikli, {})}>
            {t(S.opste.nazad)}
          </Link>
        </Toolbar>
      </Stack>

      <Card>
        <div className={styles.polja}>
          <Polje oznaka={t(S.artikal.skraceniNaziv)} vrednost={original.skraceniNaziv} />
          <Polje oznaka={t(S.artikal.jedinicaMere)} vrednost={original.jedinicaMereOznaka} />
          <Polje oznaka={t(S.artikal.grupaArtikla)} vrednost={original.grupaArtiklaNaziv} />
          <Polje oznaka={t(S.artikal.kolicinaUJM)} vrednost={String(original.kolicinaUJediniciMere)} />
        </div>
      </Card>

      {Html.map(pakovanja)(Pakovanja.view(model.loaded.pakovanja))(dispatch)}

      {Option.isSome(model.loaded.azuriranje) &&
        Html.map(azuriranje)(Azuriranje.view(model.loaded.azuriranje.value))(dispatch)}
      {Option.isSome(model.loaded.brisanje) && Html.map(brisanje)(Brisanje.view(model.loaded.brisanje.value))(dispatch)}
    </Stack>
  )
}
