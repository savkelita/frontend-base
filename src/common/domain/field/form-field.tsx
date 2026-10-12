import { Field } from '@fluentui/react-components'
import type { LocalsBase } from 'effect-form/Locals'
import type { ReactNode } from 'react'

export interface FormFieldProps {
  readonly l: LocalsBase
  readonly children: ReactNode
}

export const FormField = ({ l, children }: FormFieldProps): ReactNode => (
  <Field
    {...(l.label === undefined ? {} : { label: { children: l.label, htmlFor: l.id } })}
    required={l.required}
    validationState={l.hasError ? 'error' : 'none'}
    {...(l.error === undefined ? {} : { validationMessage: l.error })}
  >
    {children}
  </Field>
)
