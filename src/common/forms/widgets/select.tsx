import { Field, Dropdown, Option as DropdownOption } from '@fluentui/react-components'
import type { ReactElement } from 'react'
import type { SelectOption } from '../core/types'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Select widget
// -------------------------------------------------------------------------------------
//
// A single-choice dropdown backed by a string value. Options are supplied per field
// (they are runtime data, not part of the schema). Config:
//   - options: ReadonlyArray<{ value: string; label: string }>
//   - placeholder?: string

// Definisan u core/types, da jezgro forme može da govori o izborima bez uvoza vidžeta.
export type { SelectOption } from '../core/types'

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
  // Sačuvana vrednost bez odgovarajuće opcije (povučena enum vrednost na starom zapisu) mora
  // ipak da bude vidljiva — prazno polje bi delovalo kao da vrednosti nema.
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
