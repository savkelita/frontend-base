import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import type { ReactNode } from 'react'

export type FormDialogProps = {
  readonly title: string
  readonly submitLabel: string
  readonly isSubmitting: boolean
  readonly onSubmit: () => void
  readonly onClose: () => void
  readonly children: ReactNode
}

const useStyles = makeStyles({
  surface: {
    width: '640px',
    maxWidth: '90vw',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

export const FormDialog = ({
  title,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
  children,
}: FormDialogProps): ReactNode => {
  const styles = useStyles()

  return (
    <Dialog open modalType="modal" onOpenChange={(_event, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <form
          noValidate
          onSubmit={event => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <DialogBody>
            <DialogTitle>{title}</DialogTitle>

            <DialogContent className={styles.content}>{children}</DialogContent>

            <DialogActions>
              <Button appearance="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="extra-small" /> : submitLabel}
              </Button>
              <Button appearance="secondary" type="button" disabled={isSubmitting} onClick={onClose}>
                Odustani
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
