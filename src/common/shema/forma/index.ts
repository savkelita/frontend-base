import * as polja from './polje'
import { object } from './object'

// -------------------------------------------------------------------------------------
// Форма — јавни интерфејс
// -------------------------------------------------------------------------------------
//
// Пише се једном, на једном месту:
//
//   export const fields = {
//     sifra: Form.code30({ label: 'Шифра' }),
//     jedinicaMere: JedinicaMereCombo,
//     kolicina: Form.decimal({ label: 'Количина', min: 0 }),
//   }
//
//   export const ArtikalForm = Form.object(fields)
//
// Одатле се изводи и празна вредност, и шема за проверу, и опције виџета, и стање претраге
// за комбое. Екран о форми зна само `update`, `submit` и `render`.

export const Form = { ...polja, object }

export type { Polje, ComboCfg } from './polje'
export type { Fields, Draft, Payload, FormModel, FormMsg, FormSpec, FieldRenderer, Layout } from './object'
export { changed, comboMsg } from './object'
