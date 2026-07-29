import { Form } from '../../common/forms'
import type { FormModel, FormMsg, FieldRenderer, Payload } from '../../common/forms'
import * as Api from '../api'
import { Category } from '../category'

// -------------------------------------------------------------------------------------
// Product EDIT form — deliberately a different (smaller) form than create.
// -------------------------------------------------------------------------------------
//
// Create and update forms need not match: `category` is chosen at creation and cannot be
// changed here (rendered read-only), and this form omits the create-only fields entirely.

export const fields = {
  title: Form.name({ label: 'Naziv' }),
  category: Form.enumField({ label: 'Kategorija', options: Category.options }),
  price: Form.decimal({ label: 'Cena', min: 0 }),
  stock: Form.int({ label: 'Zaliha', min: 0 }),
  description: Form.desc({ label: 'Opis', optional: true }),
}

// category is set on create and locked here.
export const ProductEditForm = Form.object(fields, { rules: () => ({ category: { readonly: true } }) })

export type EditFieldKey = keyof typeof fields
export type ProductEditFormModel = FormModel<typeof fields>
export type ProductEditFormMsg = FormMsg<typeof fields>

// record (daj-info) -> encoded draft (numbers -> strings, etc.)
export const toDraft = (r: Api.EditProductRecord) => ({
  title: r.title,
  category: r.category,
  price: String(r.price),
  stock: String(r.stock),
  description: r.description ?? '',
})

// validated payload + identity -> update command. `category` is intentionally dropped;
// `id` + `version` are injected from the loaded original (optimistic concurrency).
export const toUpdateBody = (
  payload: Payload<typeof fields>,
  original: Api.ObjekatIdentifikator,
): Api.UpdateProductBody => ({
  id: original.id,
  version: original.version,
  title: payload.title,
  price: payload.price,
  stock: payload.stock,
  description: payload.description,
})

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } as const
const full = { gridColumn: '1 / -1' } as const

export const layout = (field: FieldRenderer<typeof fields>) => (
  <div style={grid}>
    <div style={full}>{field('title')}</div>
    <div style={full}>{field('category')}</div>
    <div>{field('price')}</div>
    <div>{field('stock')}</div>
    <div style={full}>{field('description')}</div>
  </div>
)
