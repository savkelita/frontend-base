import { Field, Input } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'
import { maskTime } from './masks'

// -------------------------------------------------------------------------------------
// Time widget — masked text input (no dropdown list)
// -------------------------------------------------------------------------------------
//
// 24-hour time. The user types digits which are auto-separated by ':' (HH:mm, or HH:mm:ss
// with `config.seconds`). The stored value is that same canonical string; validation
// (in the domain schema) rejects anything that is not a real time.

export const TimeWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  config,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => {
  const showSeconds = config?.seconds === true

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? 'error' : 'none'}
      validationMessage={errorMessage}
    >
      <Input
        style={{ width: showSeconds ? '130px' : '110px' }}
        value={value ?? ''}
        placeholder={showSeconds ? 'HH:mm:ss' : 'HH:mm'}
        disabled={disabled}
        onChange={(_e, data) => onChange(maskTime(data.value, showSeconds))}
        onBlur={onBlur}
      />
    </Field>
  )
}
