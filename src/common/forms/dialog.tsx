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
import { Option } from 'effect'
import type { ReactElement } from 'react'
import type { Load } from '../state'
import { S, t } from '../strings'
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

// -------------------------------------------------------------------------------------
// Од стања екрана до пропова дијалога
// -------------------------------------------------------------------------------------
//
// Дијалог има два одвојена канала за грешку: `state.status === 'Failed'` је запис који се
// није учитао (форме нема), а `error` је неуспело снимање (форма стоји, корисник поправља
// унос). Свако ажурирање их изводи из истог стања, па то извођење стоји овде — уместо да
// сваки вид поново гранa по истом `_tag`-у.

/** Стање форме која се снима. Ово има свака радња са формом — и креирање и измена. */
export type SavableForm<F extends Fields> = {
  readonly form: FormModel<F>
  readonly saving: boolean
  readonly error: Option.Option<string>
}

/**
 * Исто, плус учитан запис: измена мора да врати version непромењен. Креирање оригинал
 * нема, па су ово два типа а не један са необавезним пољем.
 *
 * Написано у целини, а не као пресек са SavableForm: кроз пресек TypeScript не уме да
 * закључи F (долази из мапираног типа у FormModel), па би сваки позив морао да га наведе.
 */
export type EditableForm<F extends Fields, Original> = {
  readonly form: FormModel<F>
  readonly saving: boolean
  readonly error: Option.Option<string>
  readonly original: Original
}

export type DialogStateProps<F extends Fields> = {
  readonly state: FormDialogState<F>
  readonly error: string | undefined
  readonly saveDisabled: boolean
}

const spremna = <F extends Fields>(forma: SavableForm<F>): DialogStateProps<F> => ({
  state: { status: 'Ready', model: forma.form },
  error: Option.getOrUndefined(forma.error),
  saveDisabled: forma.saving,
})

/**
 * Прима и форму која се учитава (измена) и ону која се не учитава (креирање), па исти вид
 * дијалога важи за обе радње.
 */
export function dialogProps<F extends Fields>(model: Load<SavableForm<F>>): DialogStateProps<F>
export function dialogProps<F extends Fields>(model: SavableForm<F>): DialogStateProps<F>
export function dialogProps<F extends Fields>(model: SavableForm<F> | Load<SavableForm<F>>): DialogStateProps<F> {
  if (!('_tag' in model)) return spremna(model)
  switch (model._tag) {
    case 'Loading':
      return { state: { status: 'Loading' }, error: undefined, saveDisabled: true }
    case 'Loaded':
      return spremna(model.loaded)
    case 'Failed':
      return { state: { status: 'Failed', error: model.message }, error: undefined, saveDisabled: true }
  }
}

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
            {state.status === 'Loading' && <Spinner labelPosition="below" label={t(S.opste.ucitavanje)} />}
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
              {t(S.opste.zatvori)}
            </Button>
            {state.status === 'Ready' && (
              <Button appearance="primary" disabled={submitting || props.saveDisabled} onClick={props.onSubmit}>
                {submitting ? t(S.opste.snimanje) : (props.submitLabel ?? t(S.opste.sacuvaj))}
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
              {t(S.opste.odustani)}
            </Button>
            <Button appearance="primary" disabled={props.busy} onClick={props.onConfirm}>
              {props.busy ? t(S.opste.brisanje) : (props.confirmLabel ?? t(S.opste.obrisi))}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
