import { Field, Dropdown, Option as DropdownOption } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Select widget
// -------------------------------------------------------------------------------------
//
// A single-choice dropdown backed by a string value. Options are supplied per field
// (they are runtime data, not part of the schema). Config:
//   - options: ReadonlyArray<{ value: string; label: string }>
//   - placeholder?: string

export type SelectOption = { readonly value: string; readonly label: string }

export const SelectWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  config,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => {
  const options = (config?.options as ReadonlyArray<SelectOption> | undefined) ?? []
  const selected = options.find(o => o.value === value)
  // A stored value with no matching option (a retired enum member on an old record) still
  // has to be visible — showing an empty box would read as "no value".
  const display = selected?.label ?? value ?? ''

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? 'error' : 'none'}
      validationMessage={errorMessage}
    >
      <Dropdown
        disabled={disabled}
        placeholder={config?.placeholder as string | undefined}
        selectedOptions={value ? [value] : []}
        value={display}
        onOptionSelect={(_e, data) => onChange(data.optionValue ?? '')}
        onBlur={onBlur}
      >
        {options.map(option => (
          <DropdownOption key={option.value} value={option.value}>
            {option.label}
          </DropdownOption>
        ))}
      </Dropdown>
    </Field>
  )
}
