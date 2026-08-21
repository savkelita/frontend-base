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
import { useState, type ReactNode } from 'react'
import { UnloadGuard } from './unload-guard'

export type FormDialogProps = {
  readonly title: string
  readonly submitLabel: string
  readonly isSubmitting: boolean
  readonly submitDisabled?: boolean
  /** Nesacuvane izmene: zatvaranje trazi potvrdu, a osvezavanje strane upozorava. */
  readonly dirty?: boolean
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

export type ConfirmDialogProps = {
  readonly title: string
  readonly confirmLabel: string
  readonly isSubmitting?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly children: ReactNode
}

export const ConfirmDialog = ({
  title,
  confirmLabel,
  isSubmitting = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps): ReactNode => {
  const styles = useStyles()

  return (
    <Dialog open modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>

          <DialogContent className={styles.content}>{children}</DialogContent>

          <DialogActions>
            <Button appearance="primary" disabled={isSubmitting} onClick={onConfirm}>
              {isSubmitting ? <Spinner size="extra-small" /> : confirmLabel}
            </Button>
            <Button appearance="secondary" disabled={isSubmitting} onClick={onCancel}>
              Nazad
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export const FormDialog = ({
  title,
  submitLabel,
  isSubmitting,
  submitDisabled = false,
  dirty = false,
  onSubmit,
  onClose,
  children,
}: FormDialogProps): ReactNode => {
  const styles = useStyles()
  const [potvrda, setPotvrda] = useState(false)

  const zatvori = () => (dirty ? setPotvrda(true) : onClose())

  return (
    <>
      <UnloadGuard active={dirty} />
      {potvrda && (
        <ConfirmDialog
          title="Odustajanje od izmena"
          confirmLabel="Odustani"
          onConfirm={onClose}
          onCancel={() => setPotvrda(false)}
        >
          Uneli ste izmene koje nisu sacuvane. Ako odustanete, bice izgubljene.
        </ConfirmDialog>
      )}
      <Dialog open modalType="modal" onOpenChange={(_event, data) => !data.open && zatvori()}>
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
                <Button appearance="primary" type="submit" disabled={isSubmitting || submitDisabled}>
                  {isSubmitting ? <Spinner size="extra-small" /> : submitLabel}
                </Button>
                <Button appearance="secondary" type="button" disabled={isSubmitting} onClick={zatvori}>
                  Odustani
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </>
  )
}
