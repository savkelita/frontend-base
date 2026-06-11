import { Schema } from 'effect'

// =====================================================================================
// PHASE 0 — explicit, hand-rolled form prototype (NO library).
//
// The goal of this module is to build a deliberately complex form entirely by hand so the
// repetitive parts surface. Everything marked `// BOILERPLATE:` is what Phase 1+ extracts
// into `tea-effect/Form`. Read this file together with ./index.tsx.
// =====================================================================================

// -------------------------------------------------------------------------------------
// Domain schema (Output)
// -------------------------------------------------------------------------------------
//
// `Values` (what the inputs hold) is the Schema *Encoded* type — every leaf is a
// string-ish primitive coming straight out of an <input>. `Order` (what Submit produces)
// is the Schema *Type* — the decoded, validated domain value (numbers are numbers, the
// customer is a proper discriminated union, ...). Decoding `Values` with `OrderSchema` is
// the single source of truth for BOTH submission and per-field error display.

// BOILERPLATE: the same `NonEmptyString + maxLength` / `NumberFromString + refinements`
// shapes are hand-written for every field below, and the validation lives right next to
// this one form. Phase 4 extracts these into reusable, branded, UI-agnostic domain
// primitives (`Name`, `Sku`, `PostalCode`, `Quantity`, ...) defined once and shared.

const PersonCustomer = Schema.Struct({
  kind: Schema.Literal('person'),
  firstName: Schema.NonEmptyString.pipe(Schema.maxLength(80)),
  lastName: Schema.NonEmptyString.pipe(Schema.maxLength(80)),
})

const CompanyCustomer = Schema.Struct({
  kind: Schema.Literal('company'),
  companyName: Schema.NonEmptyString.pipe(Schema.maxLength(120)),
  vatId: Schema.NonEmptyString.pipe(
    Schema.pattern(/^[A-Z]{2}[0-9]{8,12}$/, { message: () => 'Expected e.g. DE12345678' }),
  ),
})

// Dependent / discriminated field: which fields exist depends on `kind`.
const Customer = Schema.Union(PersonCustomer, CompanyCustomer)

// Nested struct.
const Address = Schema.Struct({
  street: Schema.NonEmptyString.pipe(Schema.maxLength(120)),
  city: Schema.NonEmptyString.pipe(Schema.maxLength(80)),
  postalCode: Schema.NonEmptyString.pipe(Schema.pattern(/^[0-9]{4,6}$/, { message: () => 'Expected 4–6 digits' })),
})

// One element of the dynamic list.
const OrderItem = Schema.Struct({
  sku: Schema.NonEmptyString.pipe(Schema.maxLength(40)),
  quantity: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
  unitPrice: Schema.NumberFromString.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const OrderSchema = Schema.Struct({
  reference: Schema.NonEmptyString.pipe(Schema.maxLength(40)),
  priority: Schema.Literal('low', 'normal', 'high'),
  customer: Customer,
  shipping: Address,
  items: Schema.Array(OrderItem).pipe(Schema.minItems(1)),
}).pipe(
  // Cross-field rule (struct-level refinement): the order total (Σ quantity × unitPrice)
  // must be at least 1.00. This only runs once every field is individually valid, which
  // is exactly the cross-field timing pain forms have to deal with by hand.
  Schema.filter(order => {
    const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    return total >= 1 ? true : 'Order total must be at least 1.00'
  }),
)

export type Order = typeof OrderSchema.Type
export type Values = typeof OrderSchema.Encoded

// -------------------------------------------------------------------------------------
// Initial values + list element default
// -------------------------------------------------------------------------------------

// The default for a freshly-added list row.
export const newItem: Values['items'][number] = { sku: '', quantity: '1', unitPrice: '0' }

export const initialValues: Values = {
  reference: '',
  priority: 'normal',
  customer: { kind: 'person', firstName: '', lastName: '' },
  shipping: { street: '', city: '', postalCode: '' },
  items: [{ sku: '', quantity: '1', unitPrice: '0' }],
}

// -------------------------------------------------------------------------------------
// Model — the ONLY thing that goes into state
// -------------------------------------------------------------------------------------
//
// Minimal by design: just the raw `values`, the submit status, and `showErrors` (the
// error-tracking flag). Parsed values and errors are NEVER stored — they are derived from
// `values` via `OrderSchema` on every render (see ./index.tsx). `showErrors` controls only
// the *display* of errors (validate-on-submit), not whether parsing happens.

export type Model = {
  readonly values: Values
  readonly showErrors: boolean
  readonly submitting: boolean
  readonly submitted: boolean
}
