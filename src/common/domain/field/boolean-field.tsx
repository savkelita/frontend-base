import { Dropdown, Option } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { FormField } from './form-field'

export interface BooleanFieldOptions {
  readonly placeholder?: string
  readonly da?: string
  readonly ne?: string
}

export type BooleanForm = boolean | null

export const booleanField = (l: Locals<BooleanForm, BooleanFieldOptions>): ReactNode => {
  const da = l.da ?? 'Da'
  const ne = l.ne ?? 'Ne'

  return (
    <FormField l={l}>
      <Dropdown
        id={l.id}
        name={l.name}
        clearable
        disabled={l.disabled}
        value={l.value === null ? '' : l.value ? da : ne}
        selectedOptions={l.value === null ? [] : [String(l.value)]}
        {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
        onOptionSelect={(_event, data) => {
          const [first] = data.selectedOptions
          l.onChange(first === undefined ? null : first === 'true')
        }}
      >
        <Option value="true">{da}</Option>
        <Option value="false">{ne}</Option>
      </Dropdown>
    </FormField>
  )
}
