import { Field, Dropdown, Option as DropdownOption } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'
import type { SelectOption } from './select'

// -------------------------------------------------------------------------------------
// Multi-select widget (multi enum)
// -------------------------------------------------------------------------------------
//
// A multiselect dropdown over static options. Value is an array of the chosen values.
// Config: { options: SelectOption[], placeholder?: string }

export const MultiSelectWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  config,
  onChange,
  onBlur,
}: WidgetProps<readonly string[]>): ReactElement => {
  const options = (config?.options as ReadonlyArray<SelectOption> | undefined) ?? []
  const selected = value ?? []
  const selectedLabels = options
    .filter(o => selected.includes(o.value))
    .map(o => o.label)
    .join(', ')

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? 'error' : 'none'}
      validationMessage={errorMessage}
    >
      <Dropdown
        multiselect
        disabled={disabled}
        placeholder={config?.placeholder as string | undefined}
        selectedOptions={[...selected]}
        value={selectedLabels}
        onOptionSelect={(_e, data) => onChange(data.selectedOptions)}
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
