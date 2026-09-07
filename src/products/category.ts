import { defineEnum } from '../common/domain'

// Product category — one definition, reused by every product form/screen.
export const Category = defineEnum([
  { value: 'beauty', label: 'Beauty' },
  { value: 'fragrances', label: 'Fragrances' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'groceries', label: 'Groceries' },
])

// Product labels/tags — multi-select enum (a product can carry several).
export const Oznake = defineEnum([
  { value: 'novo', label: 'Novo' },
  { value: 'akcija', label: 'Akcija' },
  { value: 'popust', label: 'Popust' },
  { value: 'limitirano', label: 'Limitirano' },
])
