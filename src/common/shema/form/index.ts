import type { Schema } from 'effect'
import * as EffectForm from 'effect-form/Form'
import * as Validation from 'effect-form/Validation'
import type { ReactNode } from 'react'

export const { render } = EffectForm.make<ReactNode>()

export type Options<V> = EffectForm.FieldOptions<ReactNode, V>

export type VForm<A, I, R, V> = (form: V) => Schema.Schema<A, I, R>

export const validate = <A, I, R, V>(vForm: VForm<A, I, R, V>, form: V): Validation.Result<A> =>
  Validation.validate(vForm(form), form)

export const visibleIssues = <A, I, R, V>(
  vForm: VForm<A, I, R, V>,
  form: V,
  showErrors: boolean,
): ReadonlyArray<Validation.Issue> => {
  if (!showErrors) return []
  const result = validate(vForm, form)
  return result.isValid ? [] : result.issues
}
