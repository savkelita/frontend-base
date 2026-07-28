import { Field, Checkbox } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Boolean widget
// -------------------------------------------------------------------------------------

export const BoolWidget = ({
  label,
  value,
  errorMessage,
  disabled,
  onChange,
  onBlur,
}: WidgetProps<boolean>): ReactElement => (
  <Field validationState={errorMessage ? 'error' : 'none'} validationMessage={errorMessage}>
    <Checkbox
      checked={value ?? false}
      disabled={disabled}
      label={label}
      onChange={(_e, data) => onChange(data.checked === true)}
      onBlur={onBlur}
    />
  </Field>
)
