import { Button, Combobox, Field, MessageBar, Option, Spinner, makeStyles, tokens } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { reportError } from '../../error'
import { ErrorView } from '../../error/view'
import { Data, rows } from '../../pretraga'
import { LIMIT, type Model } from '../combo/model'
import { closed, more, opened, selected, typed, type Msg } from '../combo/msg'

export type ComboFieldOptions<A> = {
  readonly model: Model<A>
  readonly onMsg: (msg: Msg<A>) => void
  readonly placeholder?: string
}

export type Render<A> = {
  readonly id: (value: A) => number
  readonly render: (value: A) => string
}

const useStyles = makeStyles({
  message: {
    padding: tokens.spacingVerticalS,
  },
  more: {
    display: 'flex',
    position: 'sticky',
    bottom: 0,
  },
  moreButton: {
    flexGrow: 1,
  },
})

const moreLabel = (loaded: number, total: number): string => {
  const rest = total - loaded
  return rest > LIMIT ? `Ucitaj jos ${LIMIT} (preostalo ${rest})` : `Ucitaj jos ${rest}`
}

export type ComboListboxProps<A> = {
  readonly model: Model<A>
  readonly onMsg: (msg: Msg<A>) => void
} & Render<A>

export const ComboListbox = <A,>({ model, onMsg, id, render }: ComboListboxProps<A>): ReactNode => {
  const styles = useStyles()

  const choices = (list: ReadonlyArray<A>): ReactNode =>
    list.map(item => (
      <Option key={id(item)} value={String(id(item))}>
        {render(item)}
      </Option>
    ))

  if (model.data === null) return null

  return Data.$match(model.data, {
    Loading: ({ previous }) => (
      <>
        {previous === null ? null : choices(previous.rows)}
        <div className={styles.message}>
          <Spinner size="small" labelPosition="below" label="Preuzimam podatke..." />
        </div>
      </>
    ),
    Ready: ({ page }) =>
      page.rows.length === 0 ? (
        <div className={styles.message}>
          <MessageBar intent="info">Nema rezultata za zadati kriterijum</MessageBar>
        </div>
      ) : (
        <>
          {choices(page.rows)}
          {page.rows.length < page.total && (
            <div className={styles.more}>
              <Button className={styles.moreButton} appearance="primary" onClick={() => onMsg(more<A>())}>
                {moreLabel(page.rows.length, page.total)}
              </Button>
            </div>
          )}
        </>
      ),
    Failed: ({ error }) => (
      <div className={styles.message}>
        <ErrorView report={reportError(error)} />
      </div>
    ),
  })
}

const ComboView = <A,>({ l, id, render }: { l: Locals<A | null, ComboFieldOptions<A>> } & Render<A>): ReactNode => {
  const { model, onMsg } = l
  const items = model.data === null ? [] : rows(model.data)

  return (
    <Field
      {...(l.label === undefined ? {} : { label: l.label })}
      required={l.required}
      validationState={l.hasError ? 'error' : 'none'}
      {...(l.error === undefined ? {} : { validationMessage: l.error })}
    >
      <Combobox
        id={l.id}
        name={l.name}
        disabled={l.disabled}
        {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
        value={l.value === null ? model.input : render(l.value)}
        selectedOptions={l.value === null ? [] : [String(id(l.value))]}
        open={model.open}
        clearable
        autoComplete="off"
        onOpenChange={(_event, data) => onMsg(data.open ? opened<A>() : closed<A>())}
        onChange={event => {
          if (l.value !== null) onMsg(selected<A>([]))
          onMsg(typed<A>(event.target.value))
        }}
        onOptionSelect={(_event, data) => {
          const [first] = data.selectedOptions
          const row = items.find(item => String(id(item)) === first)
          onMsg(selected<A>(row === undefined ? [] : [row]))
          onMsg(closed<A>())
        }}
      >
        <ComboListbox model={model} onMsg={onMsg} id={id} render={render} />
      </Combobox>
    </Field>
  )
}

export const comboField =
  <A,>({ id, render }: Render<A>) =>
  (l: Locals<A | null, ComboFieldOptions<A>>): ReactNode => <ComboView l={l} id={id} render={render} />
