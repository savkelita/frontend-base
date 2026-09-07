import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { Fields, FormModel, FormMsg, FormSpec } from './core/object'
import type { FieldRenderer } from './page'

// -------------------------------------------------------------------------------------
// Form.dialog — the same form, rendered as a modal (the sibling of Form.page)
// -------------------------------------------------------------------------------------
//
// Create renders immediately (status 'Ready'); edit loads first ('Loading' -> 'Ready' /
// 'Failed'), so the dialog owns that load-state and shows a spinner / error inside the
// modal frame. The field body is the same `layout` render-prop as Form.page.

export type FormDialogState<F extends Fields> =
  | { readonly status: 'Loading' }
  | { readonly status: 'Ready'; readonly model: FormModel<F> }
  | { readonly status: 'Failed'; readonly error: string }

export type FormDialogProps<F extends Fields> = {
  readonly spec: FormSpec<F>
  readonly state: FormDialogState<F>
  readonly layout: (field: FieldRenderer<F>) => ReactElement
  readonly title: string
  readonly dispatch: (msg: FormMsg<F>) => void
  readonly onSubmit: () => void
  readonly onClose: () => void
  /** Save error (shown above the fields when Ready). */
  readonly error?: string
  readonly submitLabel?: string
  readonly width?: number
  readonly saveDisabled?: boolean
}

const useStyles = makeStyles({
  content: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
})

const backdrop = <div style={{ backgroundColor: 'rgba(0,0,0,.4)', width: '100%', height: '100%' }} aria-hidden="true" />

export const dialog = <F extends Fields>(props: FormDialogProps<F>): ReactElement => <FormDialogView {...props} />

const FormDialogView = <F extends Fields>(props: FormDialogProps<F>): ReactElement => {
  const styles = useStyles()
  const { state } = props
  const submitting = state.status === 'Ready' && state.model.status === 'Submitting'
  const field: FieldRenderer<F> = key =>
    state.status === 'Ready' ? props.spec.render(state.model, key)(props.dispatch) : null

  return (
    <Dialog open modalType="non-modal">
      <DialogSurface backdrop={backdrop} style={{ maxWidth: props.width ?? 640 }}>
        <DialogBody>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogContent className={styles.content}>
            {state.status === 'Loading' && <Spinner labelPosition="below" label="Učitavanje…" />}
            {state.status === 'Failed' && (
              <MessageBar intent="error">
                <MessageBarBody>{state.error}</MessageBarBody>
              </MessageBar>
            )}
            {state.status === 'Ready' && (
              <>
                {props.error && (
                  <MessageBar intent="error">
                    <MessageBarBody>{props.error}</MessageBarBody>
                  </MessageBar>
                )}
                {props.layout(field)}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" disabled={submitting} onClick={props.onClose}>
              Zatvori
            </Button>
            {state.status === 'Ready' && (
              <Button appearance="primary" disabled={submitting || props.saveDisabled} onClick={props.onSubmit}>
                {submitting ? 'Snimanje…' : (props.submitLabel ?? 'Sačuvaj')}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// -------------------------------------------------------------------------------------
// Form.confirmDialog — a small confirm modal (delete)
// -------------------------------------------------------------------------------------

export type ConfirmDialogProps = {
  readonly title: string
  readonly message: string
  readonly confirmLabel?: string
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly busy?: boolean
  readonly error?: string
}

export const confirmDialog = (props: ConfirmDialogProps): ReactElement => <ConfirmDialogView {...props} />

const ConfirmDialogView = (props: ConfirmDialogProps): ReactElement => {
  const styles = useStyles()
  return (
    <Dialog open modalType="alert">
      <DialogSurface backdrop={backdrop} style={{ maxWidth: 480 }}>
        <DialogBody>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogContent className={styles.content}>
            {props.message}
            {props.error && (
              <MessageBar intent="error">
                <MessageBarBody>{props.error}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" disabled={props.busy} onClick={props.onCancel}>
              Odustani
            </Button>
            <Button appearance="primary" disabled={props.busy} onClick={props.onConfirm}>
              {props.busy ? 'Brisanje…' : (props.confirmLabel ?? 'Obriši')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
