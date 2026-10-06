import { Button, makeStyles, tokens, useId } from '@fluentui/react-components'
import { EraserRegular, SearchRegular } from '@fluentui/react-icons'
import { memo, type ReactNode } from 'react'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'

export type FilterBarProps = {
  readonly onSubmit: () => void
  readonly onClear: () => void
  readonly children: ReactNode
}

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  fields: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    flexGrow: 1,
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalM,
    minWidth: 0,
    '& > *': {
      flexGrow: 1,
      flexBasis: '180px',
      minWidth: 0,
    },
  },
  actions: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
})

export const FilterBar = ({ onSubmit, onClear, children }: FilterBarProps): ReactNode => {
  const styles = useStyles()
  const formId = useId('filter-bar-')

  return (
    <form
      id={formId}
      noValidate
      className={styles.bar}
      onSubmit={event => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className={styles.fields}>{children}</div>
      <div className={styles.actions}>
        <Button appearance="primary" type="submit" icon={<SearchRegular />}>
          Pretrazi
        </Button>
        <Button appearance="secondary" type="button" icon={<EraserRegular />} onClick={onClear}>
          Ponisti
        </Button>
      </div>
    </form>
  )
}

type FilterBarShellProps<M, Msg> = {
  readonly model: M
  readonly fields: (model: M, dispatch: Platform.Dispatch<Msg>) => ReactNode
  readonly submitted: () => Msg
  readonly cleared: () => Msg
  readonly dispatch: Platform.Dispatch<Msg>
}

const FilterBarShell = memo(
  ({ model, fields, submitted, cleared, dispatch }: FilterBarShellProps<unknown, unknown>) => (
    <FilterBar onSubmit={() => dispatch(submitted())} onClear={() => dispatch(cleared())}>
      {fields(model, dispatch)}
    </FilterBar>
  ),
) as <M, Msg>(props: FilterBarShellProps<M, Msg>) => ReactNode

export const filterBar =
  <M, Msg>(
    model: M,
    fields: (model: M, dispatch: Platform.Dispatch<Msg>) => ReactNode,
    submitted: () => Msg,
    cleared: () => Msg,
  ): TeaReact.Html<Msg> =>
  dispatch => (
    <FilterBarShell model={model} fields={fields} submitted={submitted} cleared={cleared} dispatch={dispatch} />
  )
