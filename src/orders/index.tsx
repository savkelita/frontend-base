import {
  Title1,
  Subtitle2,
  Field,
  Input,
  Select,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { AddRegular, DeleteRegular } from '@fluentui/react-icons'
import { Effect, Either, ParseResult, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { Model, Order, Values } from './model'
import { OrderSchema, initialValues, newItem } from './model'
import { Msg, formChanged, submit, submitted } from './msg'

export type { Model }
export type { Msg }

// =====================================================================================
// BOILERPLATE: per-field lenses (immutable get/set)
//
// Every input reads `values.<path>` and writes the WHOLE new `Values` back. Because the
// state is one immutable record, each field needs a hand-written setter that spreads its
// way down to the leaf. This is the single biggest source of repetition; Phase 1 replaces
// it with a generic `field({ value: v => ..., update: (s, v) => ... })` lens slot.
// =====================================================================================

const setReference = (values: Values, reference: string): Values => ({ ...values, reference })

const setPriority = (values: Values, priority: Values['priority']): Values => ({ ...values, priority })

// BOILERPLATE: switching the discriminator must reset the variant's fields by hand.
const setCustomerKind = (values: Values, kind: Values['customer']['kind']): Values => ({
  ...values,
  customer: kind === 'person' ? { kind, firstName: '', lastName: '' } : { kind, companyName: '', vatId: '' },
})

const setFirstName = (values: Values, firstName: string): Values =>
  values.customer.kind === 'person' ? { ...values, customer: { ...values.customer, firstName } } : values

const setLastName = (values: Values, lastName: string): Values =>
  values.customer.kind === 'person' ? { ...values, customer: { ...values.customer, lastName } } : values

const setCompanyName = (values: Values, companyName: string): Values =>
  values.customer.kind === 'company' ? { ...values, customer: { ...values.customer, companyName } } : values

const setVatId = (values: Values, vatId: string): Values =>
  values.customer.kind === 'company' ? { ...values, customer: { ...values.customer, vatId } } : values

const setStreet = (values: Values, street: string): Values => ({
  ...values,
  shipping: { ...values.shipping, street },
})

const setCity = (values: Values, city: string): Values => ({ ...values, shipping: { ...values.shipping, city } })

const setPostalCode = (values: Values, postalCode: string): Values => ({
  ...values,
  shipping: { ...values.shipping, postalCode },
})

// BOILERPLATE: dynamic-list add / remove / per-index update over the `values` array.
const updateItem = (values: Values, index: number, patch: Partial<Values['items'][number]>): Values => ({
  ...values,
  items: values.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
})

const addItem = (values: Values): Values => ({ ...values, items: [...values.items, newItem] })

const removeItem = (values: Values, index: number): Values => ({
  ...values,
  items: values.items.filter((_, i) => i !== index),
})

// =====================================================================================
// BOILERPLATE: error computation + path matching
//
// Errors are recomputed from `values` on EVERY render by decoding the whole form with
// `{ errors: 'all' }`, then matched back to each input by comparing path arrays. Phase 1
// hides all of this behind `Form.fields(form, state)` / `result(form, state)`.
// =====================================================================================

const decodeAll = Schema.decodeUnknownEither(OrderSchema, { errors: 'all' })

const computeIssues = (values: Values): ReadonlyArray<ParseResult.ArrayFormatterIssue> =>
  Either.match(decodeAll(values), {
    onRight: () => [],
    onLeft: error => ParseResult.ArrayFormatter.formatErrorSync(error),
  })

const errorAt = (
  issues: ReadonlyArray<ParseResult.ArrayFormatterIssue>,
  path: ReadonlyArray<PropertyKey>,
): string | undefined =>
  issues.find(issue => issue.path.length === path.length && issue.path.every((key, i) => key === path[i]))?.message

// =====================================================================================
// Commands
// =====================================================================================

// On a successful Submit we fire a real (here: simulated) side effect carrying the typed
// `Order`, then dispatch `Submitted`. The parsed `Order` flows through the Cmd — it is
// never stored in the Model.
const submitCmd = (order: Order): Cmd.Cmd<Msg> =>
  Cmd.fromEffect(
    Effect.sync(() => {
      console.log('[OrderForm] submitted', order)
      return submitted()
    }),
  )

// =====================================================================================
// Init
// =====================================================================================

export const init: [Model, Cmd.Cmd<Msg>] = [
  { values: initialValues, showErrors: false, submitting: false, submitted: false },
  Cmd.none,
]

// =====================================================================================
// Update
// =====================================================================================

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    // One message for ALL field edits: the view hands back the whole new `Values`.
    FormChanged: ({ values }): [Model, Cmd.Cmd<Msg>] => [{ ...model, values, submitted: false }, Cmd.none],

    Submit: (): [Model, Cmd.Cmd<Msg>] =>
      Either.match(decodeAll(model.values), {
        // Invalid: turn `showErrors` on so the view starts revealing errors. No parse
        // result is stored — the view recomputes errors from `values`.
        onLeft: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, showErrors: true }, Cmd.none],
        // Valid: typed `Order` in hand → fire the submit Cmd.
        onRight: (order): [Model, Cmd.Cmd<Msg>] => [{ ...model, showErrors: true, submitting: true }, submitCmd(order)],
      }),

    Submitted: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, submitting: false, submitted: true }, Cmd.none],
  })

// =====================================================================================
// View
// =====================================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '720px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalS,
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-end',
  },
  grow: {
    flexGrow: 1,
  },
})

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <OrderFormView model={model} dispatch={dispatch} />

const OrderFormView = ({ model, dispatch }: { readonly model: Model; readonly dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()
  const { values, showErrors, submitting, submitted: isSubmitted } = model

  // BOILERPLATE: recompute issues every render; only surface them once `showErrors` is on.
  const issues = computeIssues(values)
  const errorFor = (path: ReadonlyArray<PropertyKey>): string | undefined =>
    showErrors ? errorAt(issues, path) : undefined

  const change = (next: Values) => dispatch(formChanged(next))

  const rootError = errorFor([])
  const itemsError = errorFor(['items'])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        dispatch(submit())
      }}
      className={styles.container}
    >
      <Title1>New order</Title1>

      {rootError && (
        <MessageBar intent="error">
          <MessageBarBody>{rootError}</MessageBarBody>
        </MessageBar>
      )}

      {/* --- simple fields --- */}
      <Field
        label="Reference"
        validationState={errorFor(['reference']) ? 'error' : 'none'}
        validationMessage={errorFor(['reference'])}
      >
        <Input
          value={values.reference}
          onChange={(_e, d) => change(setReference(values, d.value))}
          disabled={submitting}
        />
      </Field>

      <Field label="Priority">
        <Select
          value={values.priority}
          onChange={(_e, d) => change(setPriority(values, d.value as Values['priority']))}
          disabled={submitting}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </Select>
      </Field>

      {/* --- dependent / conditional fields --- */}
      <div className={styles.section}>
        <Subtitle2>Customer</Subtitle2>
        <Field label="Customer type">
          <Select
            value={values.customer.kind}
            onChange={(_e, d) => change(setCustomerKind(values, d.value as Values['customer']['kind']))}
            disabled={submitting}
          >
            <option value="person">Person</option>
            <option value="company">Company</option>
          </Select>
        </Field>

        {/* BOILERPLATE: dependent branching is a hand-written switch in the view. */}
        {values.customer.kind === 'person' ? (
          <>
            <Field
              label="First name"
              validationState={errorFor(['customer', 'firstName']) ? 'error' : 'none'}
              validationMessage={errorFor(['customer', 'firstName'])}
            >
              <Input
                value={values.customer.firstName}
                onChange={(_e, d) => change(setFirstName(values, d.value))}
                disabled={submitting}
              />
            </Field>
            <Field
              label="Last name"
              validationState={errorFor(['customer', 'lastName']) ? 'error' : 'none'}
              validationMessage={errorFor(['customer', 'lastName'])}
            >
              <Input
                value={values.customer.lastName}
                onChange={(_e, d) => change(setLastName(values, d.value))}
                disabled={submitting}
              />
            </Field>
          </>
        ) : (
          <>
            <Field
              label="Company name"
              validationState={errorFor(['customer', 'companyName']) ? 'error' : 'none'}
              validationMessage={errorFor(['customer', 'companyName'])}
            >
              <Input
                value={values.customer.companyName}
                onChange={(_e, d) => change(setCompanyName(values, d.value))}
                disabled={submitting}
              />
            </Field>
            <Field
              label="VAT ID"
              validationState={errorFor(['customer', 'vatId']) ? 'error' : 'none'}
              validationMessage={errorFor(['customer', 'vatId'])}
            >
              <Input
                value={values.customer.vatId}
                onChange={(_e, d) => change(setVatId(values, d.value))}
                placeholder="e.g. DE12345678"
                disabled={submitting}
              />
            </Field>
          </>
        )}
      </div>

      {/* --- nested struct --- */}
      <div className={styles.section}>
        <Subtitle2>Shipping address</Subtitle2>
        <Field
          label="Street"
          validationState={errorFor(['shipping', 'street']) ? 'error' : 'none'}
          validationMessage={errorFor(['shipping', 'street'])}
        >
          <Input
            value={values.shipping.street}
            onChange={(_e, d) => change(setStreet(values, d.value))}
            disabled={submitting}
          />
        </Field>
        <Field
          label="City"
          validationState={errorFor(['shipping', 'city']) ? 'error' : 'none'}
          validationMessage={errorFor(['shipping', 'city'])}
        >
          <Input
            value={values.shipping.city}
            onChange={(_e, d) => change(setCity(values, d.value))}
            disabled={submitting}
          />
        </Field>
        <Field
          label="Postal code"
          validationState={errorFor(['shipping', 'postalCode']) ? 'error' : 'none'}
          validationMessage={errorFor(['shipping', 'postalCode'])}
        >
          <Input
            value={values.shipping.postalCode}
            onChange={(_e, d) => change(setPostalCode(values, d.value))}
            disabled={submitting}
          />
        </Field>
      </div>

      {/* --- dynamic list --- */}
      <div className={styles.section}>
        <Subtitle2>Items</Subtitle2>
        {itemsError && (
          <MessageBar intent="error">
            <MessageBarBody>{itemsError}</MessageBarBody>
          </MessageBar>
        )}
        {values.items.map((item, index) => (
          // BOILERPLATE: index-keyed rows + per-index lenses; remove/add mutate `values`.
          <div key={index} className={styles.row}>
            <Field
              className={styles.grow}
              label="SKU"
              validationState={errorFor(['items', index, 'sku']) ? 'error' : 'none'}
              validationMessage={errorFor(['items', index, 'sku'])}
            >
              <Input
                value={item.sku}
                onChange={(_e, d) => change(updateItem(values, index, { sku: d.value }))}
                disabled={submitting}
              />
            </Field>
            <Field
              label="Qty"
              validationState={errorFor(['items', index, 'quantity']) ? 'error' : 'none'}
              validationMessage={errorFor(['items', index, 'quantity'])}
            >
              <Input
                value={item.quantity}
                onChange={(_e, d) => change(updateItem(values, index, { quantity: d.value }))}
                disabled={submitting}
              />
            </Field>
            <Field
              label="Unit price"
              validationState={errorFor(['items', index, 'unitPrice']) ? 'error' : 'none'}
              validationMessage={errorFor(['items', index, 'unitPrice'])}
            >
              <Input
                value={item.unitPrice}
                onChange={(_e, d) => change(updateItem(values, index, { unitPrice: d.value }))}
                disabled={submitting}
              />
            </Field>
            <Button
              appearance="subtle"
              icon={<DeleteRegular />}
              aria-label="Remove item"
              disabled={submitting || values.items.length === 1}
              onClick={() => change(removeItem(values, index))}
            />
          </div>
        ))}
        <div>
          <Button
            appearance="subtle"
            icon={<AddRegular />}
            disabled={submitting}
            onClick={() => change(addItem(values))}
          >
            Add item
          </Button>
        </div>
      </div>

      {isSubmitted && (
        <MessageBar intent="success">
          <MessageBarBody>Order submitted — see the console for the typed Order.</MessageBarBody>
        </MessageBar>
      )}

      <div>
        <Button
          appearance="primary"
          type="submit"
          disabled={submitting}
          icon={submitting ? <Spinner size="tiny" /> : undefined}
        >
          {submitting ? 'Submitting...' : 'Submit order'}
        </Button>
      </div>
    </form>
  )
}
