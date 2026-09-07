import { Form } from '../../common/forms'
import type { FormModel, FormMsg, FieldRenderer, Payload } from '../../common/forms'
import * as Api from '../api'
import { Category, Oznake } from '../category'

// -------------------------------------------------------------------------------------
// Product form (declared with @tea-effect/forms)
// -------------------------------------------------------------------------------------

export const fields = {
  title: Form.name({ label: 'Naziv' }),
  category: Form.enumField({ label: 'Kategorija', options: Category.options }),
  price: Form.decimal({ label: 'Cena', min: 0 }),
  stock: Form.int({ label: 'Zaliha', min: 0 }),
  datumNabavke: Form.date({ label: 'Datum nabavke' }),
  vremeIsporuke: Form.time({ label: 'Vreme isporuke', optional: true }),
  // datetime: user must enter BOTH date and time; the payload is a real Date.
  terminIsporuke: Form.datetime({ label: 'Termin isporuke' }),
  // multi-enum: several static labels.
  oznake: Form.multiEnum({ label: 'Oznake', options: Oznake.options, optional: true, placeholder: 'Izaberite oznake' }),
  povezaniProizvod: Form.combo({ label: 'Povezani proizvod', optional: true, source: Api.proizvodCombo }),
  // multi-combo: several async-searched products.
  povezaniProizvodi: Form.multiCombo({ label: 'Povezani proizvodi', optional: true, source: Api.proizvodCombo }),
  grupa: Form.combo({ label: 'Grupa', optional: true, source: Api.grupaCombo }),
  // podgrupa filters by the chosen grupa: `dependsOn` resets/disables, `criteria` feeds the search.
  podgrupa: Form.combo({
    label: 'Podgrupa',
    optional: true,
    source: Api.podgrupaCombo,
    dependsOn: 'grupa',
    criteria: deps => ({ grupaID: deps.grupa }),
  }),
  description: Form.desc({ label: 'Opis', optional: true }),
  published: Form.flag({ label: 'Objavljen' }),
}

export const ProductForm = Form.object(fields)

export type FieldKey = keyof typeof fields
export type ProductFormModel = FormModel<typeof fields>
export type ProductFormMsg = FormMsg<typeof fields>

// Map the validated form values to the request body. This is the seam the feature owns:
// not every form field must be sent, and attributes not on the form (e.g. a parentId passed
// via the feature model) are injected here.
export const toCreateBody = (payload: Payload<typeof fields>): Api.CreateProductBody => ({
  ...payload,
  // e.g. injected extras: parentId: extra.parentId,
})

// -------------------------------------------------------------------------------------
// Layout — full control over each field's width & position (plain CSS grid here).
// `field(key)` renders one field; wrap it in whatever markup you want.
// -------------------------------------------------------------------------------------

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } as const
const full = { gridColumn: '1 / -1' } as const

export const layout = (field: FieldRenderer<typeof fields>) => (
  <div style={grid}>
    <div style={full}>{field('title')}</div>
    <div style={full}>{field('category')}</div>
    <div>{field('price')}</div>
    <div>{field('stock')}</div>
    <div>{field('datumNabavke')}</div>
    <div>{field('vremeIsporuke')}</div>
    <div style={full}>{field('terminIsporuke')}</div>
    <div style={full}>{field('oznake')}</div>
    <div style={full}>{field('povezaniProizvod')}</div>
    <div style={full}>{field('povezaniProizvodi')}</div>
    <div>{field('grupa')}</div>
    <div>{field('podgrupa')}</div>
    <div style={full}>{field('description')}</div>
    <div style={full}>{field('published')}</div>
  </div>
)
