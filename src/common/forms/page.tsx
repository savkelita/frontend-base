import { Title1, Button, Card, MessageBar, MessageBarBody, Link, makeStyles, tokens } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { Fields, FormModel, FormMsg, FormSpec } from './core/object'

// -------------------------------------------------------------------------------------
// Form.page — the standard form view (title, error bar, actions) with a free body
// -------------------------------------------------------------------------------------
//
// A reusable shell shared by every form screen. The feature keeps its own update/save; this
// only renders. The field arrangement is a **render prop**: you get a `field(key)` renderer
// and lay the fields out however you like (grid, columns, widths, spans) — see `layout` in
// the feature's form.ts.

export type FieldRenderer<F extends Fields> = (key: keyof F & string) => ReactElement | null

export type PageProps<F extends Fields> = {
  readonly spec: FormSpec<F>
  readonly model: FormModel<F>
  readonly title: string
  readonly dispatch: (msg: FormMsg<F>) => void
  readonly onSubmit: () => void
  /** Render the fields wherever/however you want; `field(key)` renders one field. */
  readonly layout: (field: FieldRenderer<F>) => ReactElement
  readonly error?: string
  readonly submitLabel?: string
  readonly cancel?: { readonly label: string; readonly href: string }
}

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '720px' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
  actions: { display: 'flex', gap: tokens.spacingHorizontalM, marginTop: tokens.spacingVerticalM },
})

export const page = <F extends Fields>(props: PageProps<F>): ReactElement => <FormPageView {...props} />

const FormPageView = <F extends Fields>(props: PageProps<F>): ReactElement => {
  const styles = useStyles()
  const submitting = props.model.status === 'Submitting'
  const field: FieldRenderer<F> = key => props.spec.render(props.model, key)(props.dispatch)

  return (
    <div className={styles.container}>
      <Title1>{props.title}</Title1>
      <Card className={styles.card}>
        {props.error && (
          <MessageBar intent="error">
            <MessageBarBody>{props.error}</MessageBarBody>
          </MessageBar>
        )}

        {props.layout(field)}

        <div className={styles.actions}>
          <Button appearance="primary" disabled={submitting} onClick={props.onSubmit}>
            {submitting ? 'Snimanje…' : (props.submitLabel ?? 'Sačuvaj')}
          </Button>
          {props.cancel && (
            <Link href={props.cancel.href} as="a">
              {props.cancel.label}
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
