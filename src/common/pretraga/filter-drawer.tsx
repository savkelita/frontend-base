import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
} from '@fluentui/react-components'
import { DismissRegular, EraserRegular, FilterRegular, SearchRegular } from '@fluentui/react-icons'
import type { ReactNode } from 'react'

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
    flexGrow: 0,
    flexShrink: 0,
  },
})

export const FilterDrawer = ({ open, onClose, onSubmit, onClear, children }: FilterDrawerProps): ReactNode => {
  const styles = useStyles()

  return (
    <Drawer
      type="inline"
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

      <DrawerBody>{children}</DrawerBody>

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
