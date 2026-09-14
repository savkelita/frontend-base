import { Equivalence, Option, Schema } from 'effect'
import type { ApiError } from '../../common/shema/error'
import * as Code30 from '../../common/shema/domain/code30'
import * as ComboDomain from '../../common/shema/domain/combo'
import * as Decimal from '../../common/shema/domain/decimal'
import * as Name from '../../common/shema/domain/name'
import { sBaseComboResult } from '../../common/platform'
import { renderCombo, type JedinicaMere } from './api'

// -------------------------------------------------------------------------------------
// Креирање артикла — шемом (за поређење)
// -------------------------------------------------------------------------------------
//
// Исти екран као `../kreiranje`, написан приступом са гране `feature/arhitektura`: вредност
// форме је обичан запис, валидација **јесте** шема, а виџет је закачен на шему анотацијом.

export type FormValue = {
  readonly sifra: Code30.Form
  readonly naziv: Name.Form
  readonly skraceniNaziv: Name.Form
  readonly jedinicaMere: ComboDomain.Form<JedinicaMere>
  readonly grupaArtikla: ComboDomain.Form<JedinicaMere>
  readonly kolicinaUJediniciMere: Decimal.Form
}

export const vForm = () =>
  Schema.Struct({
    sifra: Code30.vForm,
    naziv: Name.vForm,
    skraceniNaziv: Name.vForm,
    jedinicaMere: ComboDomain.vForm(sBaseComboResult, renderCombo),
    grupaArtikla: ComboDomain.vForm(sBaseComboResult, renderCombo),
    kolicinaUJediniciMere: Decimal.vForm,
  })

export type Value = Schema.Schema.Type<ReturnType<typeof vForm>>

export const EMPTY: FormValue = {
  sifra: null,
  naziv: null,
  skraceniNaziv: null,
  jedinicaMere: null,
  grupaArtikla: null,
  kolicinaUJediniciMere: null,
}

// Прљаво стање се пише руком, по форми: библиотека не зна шта значи „исто".
const sameCombo = Equivalence.mapInput(Equivalence.number, (value: ComboDomain.Form<JedinicaMere>) => value?.id ?? -1)

export const sameForm: Equivalence.Equivalence<FormValue> = Equivalence.struct({
  sifra: Equivalence.strict<Code30.Form>(),
  naziv: Equivalence.strict<Name.Form>(),
  skraceniNaziv: Equivalence.strict<Name.Form>(),
  jedinicaMere: sameCombo,
  grupaArtikla: sameCombo,
  kolicinaUJediniciMere: Equivalence.strict<Decimal.Form>(),
})

export type Model = {
  readonly value: FormValue
  readonly showErrors: boolean
  readonly isSubmitting: boolean
  readonly error: Option.Option<ApiError>
  /** По један модел комбоа, ожичен руком — форма за њих не зна. */
  readonly jedinicaMereCombo: ComboDomain.Model<JedinicaMere>
  readonly grupaArtiklaCombo: ComboDomain.Model<JedinicaMere>
}
