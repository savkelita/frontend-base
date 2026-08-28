import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DismissRegular, EraserRegular, FilterRegular, SearchRegular } from '@fluentui/react-icons'
import { memo, useSyncExternalStore, type ReactNode } from 'react'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'

export type FilterDrawerProps = {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSubmit: () => void
  readonly onClear: () => void
  readonly children: ReactNode
}

const useStyles = makeStyles({
  drawer: {
    width: '370px',
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

const NARROW = '(max-width: 900px)'

const subscribe = (onChange: () => void): (() => void) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const useNarrow = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  )

export const FilterDrawer = ({ open, onClose, onSubmit, onClear, children }: FilterDrawerProps): ReactNode => {
  const styles = useStyles()
  const narrow = useNarrow()

  return (
    <Drawer
      type={narrow ? 'overlay' : 'inline'}
      position="end"
      separator
      open={open}
      onOpenChange={(_event, data) => !data.open && onClose()}
      className={styles.drawer}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Zatvori" icon={<DismissRegular />} onClick={onClose} />}
        >
          Filter
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.fields}>{children}</DrawerBody>

      <DrawerFooter>
        <Button appearance="primary" icon={<SearchRegular />} onClick={onSubmit}>
          Pretrazi
        </Button>
        <Button appearance="secondary" icon={<EraserRegular />} onClick={onClear}>
          Ponisti
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}

export const FilterButton = ({ open, onToggle }: { readonly open: boolean; readonly onToggle: () => void }) => (
  <Button appearance={open ? 'primary' : 'secondary'} icon={<FilterRegular />} aria-pressed={open} onClick={onToggle}>
    Filter
  </Button>
)

type Open = { readonly isOpen: boolean }

type FilterShellProps<M extends Open, Msg> = {
  readonly model: M
  readonly fields: (model: M, dispatch: Platform.Dispatch<Msg>) => ReactNode
  readonly toggled: () => Msg
  readonly submitted: () => Msg
  readonly cleared: () => Msg
  readonly dispatch: Platform.Dispatch<Msg>
}

const FilterShell = memo(
  ({ model, fields, toggled, submitted, cleared, dispatch }: FilterShellProps<Open, unknown>) => (
    <FilterDrawer
      open={model.isOpen}
      onClose={() => dispatch(toggled())}
      onSubmit={() => dispatch(submitted())}
      onClear={() => dispatch(cleared())}
    >
      {fields(model, dispatch)}
    </FilterDrawer>
  ),
) as <M extends Open, Msg>(props: FilterShellProps<M, Msg>) => ReactNode

export const filterView =
  <M extends Open, Msg>(
    model: M,
    fields: (model: M, dispatch: Platform.Dispatch<Msg>) => ReactNode,
    toggled: () => Msg,
    submitted: () => Msg,
    cleared: () => Msg,
  ): TeaReact.Html<Msg> =>
  dispatch => (
    <FilterShell
      model={model}
      fields={fields}
      toggled={toggled}
      submitted={submitted}
      cleared={cleared}
      dispatch={dispatch}
    />
  )

export const filterButton =
  <Msg,>(isOpen: boolean, toggled: () => Msg): TeaReact.Html<Msg> =>
  dispatch => <FilterButton open={isOpen} onToggle={() => dispatch(toggled())} />
