import { Input } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { FormField } from './form-field'

export interface TextFieldOptions {
  readonly className?: string
  readonly type?: 'text' | 'password' | 'email'
  readonly autoComplete?: string
  readonly autoFocus?: boolean
  readonly placeholder?: string
}

export type TextForm = string | null

export const textControl = (l: Locals<TextForm, TextFieldOptions>): ReactNode => (
  <>
    <Input
      {...(l.className === undefined ? {} : { className: l.className })}
      id={l.id}
      name={l.name}
      type={l.type ?? 'text'}
      value={l.value ?? ''}
      disabled={l.disabled}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      autoComplete={l.autoComplete ?? 'off'}
      {...(l.autoFocus === undefined ? {} : { autoFocus: l.autoFocus })}
      onChange={(_e, data) => l.onChange(data.value === '' ? null : data.value)}
    />
  </>
)

export const textField = (l: Locals<TextForm, TextFieldOptions>): ReactNode => (
  <FormField l={l}>{textControl(l)}</FormField>
)
