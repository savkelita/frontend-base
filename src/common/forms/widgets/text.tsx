import { Field, Input, Textarea } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Text widget
// -------------------------------------------------------------------------------------
//
// Backs any schema whose encoded value is a string. Config:
//   - placeholder?: string
//   - multiline?: boolean   -> renders a Textarea
//   - type?: InputProps['type']

export const TextWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  config,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => {
  const placeholder = config?.placeholder as string | undefined
  const multiline = config?.multiline === true
  const type = config?.type as 'text' | 'email' | 'tel' | 'url' | undefined

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? 'error' : 'none'}
      validationMessage={errorMessage}
    >
      {multiline ? (
        <Textarea
          value={value ?? ''}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(_e, data) => onChange(data.value)}
          onBlur={onBlur}
        />
      ) : (
        <Input
          value={value ?? ''}
          disabled={disabled}
          placeholder={placeholder}
          type={type}
          autoComplete="off"
          onChange={(_e, data) => onChange(data.value)}
          onBlur={onBlur}
        />
      )}
    </Field>
  )
}
