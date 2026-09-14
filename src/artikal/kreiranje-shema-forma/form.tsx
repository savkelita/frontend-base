import { Form } from '../../common/shema/forma'
import type { FieldRenderer, FormModel as ModelOf, FormMsg as MsgOf } from '../../common/shema/forma'
import { sBaseComboResult } from '../../common/platform'
import { pretraziGrupaArtiklaCombo, pretraziJedinicaMereCombo, renderCombo } from '../kreiranje-shema/api'

// -------------------------------------------------------------------------------------
// Креирање артикла — декларација форме
// -------------------------------------------------------------------------------------
//
// Исти облик као у `../kreiranje/form.tsx`: поље се пише једном, а из њега се изводи и
// вредност, и провера, и виџет. Разлика према `../kreiranje` је испод — провера је шема а не
// правило по пољу — али се одавде не види, и не треба ни да се види.

export const fields = {
  sifra: Form.code30({ label: 'Шифра', autoFocus: true }),
  naziv: Form.name({ label: 'Назив' }),
  skraceniNaziv: Form.name({ label: 'Скраћени назив' }),
  jedinicaMere: Form.combo({
    label: 'Јединица мере',
    io: sBaseComboResult,
    source: pretraziJedinicaMereCombo,
    render: renderCombo,
  }),
  grupaArtikla: Form.combo({
    label: 'Група артикла',
    io: sBaseComboResult,
    source: pretraziGrupaArtiklaCombo,
    render: renderCombo,
  }),
  // Кад форма не креће од празног поља, почетна вредност стоји уз само поље.
  kolicinaUJediniciMere: Form.decimal({ label: 'Количина у јединици мере', min: 0, initialValue: '1,00' }),
}

export type Fields = typeof fields
export type FormModel = ModelOf<Fields>
export type FormMsg = MsgOf<Fields>

export const form = Form.object(fields)

export const layout = (field: FieldRenderer<Fields>) => (
  <>
    {field('sifra')}
    {field('naziv')}
    {field('skraceniNaziv')}
    {field('jedinicaMere')}
    {field('grupaArtikla')}
    {field('kolicinaUJediniciMere')}
  </>
)
