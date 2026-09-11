import { Field, Text } from '@fluentui/react-components'
import { Form } from '../../common/forms'
import type { FieldRenderer, FormModel, FormMsg } from '../../common/forms'
import { S, t } from '../../common/strings'
import type { ArtikalInfo } from '../api'
import { GrupaArtiklaCombo, JedinicaMereCombo } from '../combo-definitions'

// -------------------------------------------------------------------------------------
// Ажурирање артикла — декларација форме
// -------------------------------------------------------------------------------------
//
// Шифра овде **није поље**. Она се додељује при уносу и после тога је идентитет записа, па
// стоји само као приказ из учитаног записа — исто као `<ReadonlyField label="Šifra">` у
// затеченим пројектима. Раније је била поље закључано преко `rules`, што је значило да
// форма носи вредност коју корисник не сме да мења: једно правило више које се лако
// заборави, и поље у нацрту које нема разлог да буде тамо.

export const fields = {
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

/** Учитан запис у нацрт форме; combo поље носи и лабелу, која је већ у одговору. */
export const initialForm = (original: ArtikalInfo) => ({
  naziv: original.naziv,
  skraceniNaziv: original.skraceniNaziv,
  jedinicaMere: { id: original.jedinicaMereID, label: original.jedinicaMereOznaka },
  grupaArtikla: { id: original.grupaArtiklaID, label: original.grupaArtiklaNaziv },
  kolicinaUJediniciMere: original.kolicinaUJediniciMere,
})

/**
 * Распоред зна за учитан запис, јер шифру приказује из њега а не из форме. Дијалог га зове
 * тек кад је запис ту, па `undefined` значи само да поља још нема шта да прикаже.
 */
export const layout = (original: ArtikalInfo | undefined) => (field: FieldRenderer<Fields>) => (
  <>
    <Field label={t(S.artikal.sifra)}>
      <Text>{original?.sifra ?? ''}</Text>
    </Field>
    {field('naziv')}
    {field('skraceniNaziv')}
    {field('jedinicaMere')}
    {field('grupaArtikla')}
    {field('kolicinaUJediniciMere')}
  </>
)
