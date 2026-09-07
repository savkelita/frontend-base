import { Field, Input } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Number widget
// -------------------------------------------------------------------------------------
//
// The input always holds the raw string the user typed; the field schema (e.g.
// NumberFromString) decodes it to a number on submit. This keeps partial input like
// "12." editable without fighting the model. Config:
//   - placeholder?: string
//   - contentAfter?: ReactElement (units, currency, ...)

export const NumberWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  config,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => (
  <Field
    label={label}
    required={required}
    validationState={errorMessage ? 'error' : 'none'}
    validationMessage={errorMessage}
  >
    <Input
      value={value ?? ''}
      disabled={disabled}
      inputMode="decimal"
      autoComplete="off"
      placeholder={config?.placeholder as string | undefined}
      contentAfter={config?.contentAfter as ReactElement | undefined}
      input={{ style: { textAlign: 'end' } }}
      onChange={(_e, data) => onChange(data.value)}
      onBlur={onBlur}
    />
  </Field>
)
