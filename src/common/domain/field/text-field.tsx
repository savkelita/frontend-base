import { Field, Input } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'

export interface TextFieldOptions {
  readonly type?: 'text' | 'password' | 'email'
  readonly autoComplete?: string
  readonly autoFocus?: boolean
  readonly placeholder?: string
}

export type TextForm = string | null

export const textField = (l: Locals<TextForm, TextFieldOptions>): ReactNode => (
  <Field
    {...(l.label === undefined ? {} : { label: l.label })}
    required={l.required}
    validationState={l.hasError ? 'error' : 'none'}
    {...(l.error === undefined ? {} : { validationMessage: l.error })}
  >
    <Input
      id={l.id}
      name={l.name}
      type={l.type ?? 'text'}
      value={l.value ?? ''}
      disabled={l.disabled}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      {...(l.autoComplete === undefined ? {} : { autoComplete: l.autoComplete })}
      {...(l.autoFocus === undefined ? {} : { autoFocus: l.autoFocus })}
      onChange={(_e, data) => l.onChange(data.value === '' ? null : data.value)}
    />
  </Field>
)
