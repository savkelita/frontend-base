import { Form } from '../../common/forms'
import type { FieldRenderer, FormModel, FormMsg } from '../../common/forms'
import { GrupaArtiklaCombo, JedinicaMereCombo } from '../combo-definitions'

// -------------------------------------------------------------------------------------
// Креирање артикла — декларација форме
// -------------------------------------------------------------------------------------
//
// Своја форма, одвојена од оне за измену: команде носе различит скуп поља, па их ни форме
// не смеју делити. Оно што им је заједничко — combo извори — стоји у `combo-definitions`,
// па се ознака и извор не преписују.

export const fields = {
  sifra: Form.code30({ label: 'Шифра' }),
  naziv: Form.name({ label: 'Назив' }),
  skraceniNaziv: Form.name({ label: 'Скраћени назив' }),
  jedinicaMere: JedinicaMereCombo,
  grupaArtikla: GrupaArtiklaCombo,
  kolicinaUJediniciMere: Form.decimal({ label: 'Количина у јединици мере', min: 0 }),
}

export type Fields = typeof fields
export type ArtikalFormModel = FormModel<Fields>
export type ArtikalFormMsg = FormMsg<Fields>

export const ArtikalForm = Form.object(fields)

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
