import { Dropdown, Field, Option } from '@fluentui/react-components'
import type { Locals, LocalsBase } from 'effect-form/Locals'
import type { ReactNode } from 'react'

export interface Choice<A> {
  readonly value: A
  readonly text: string
}

export interface DropdownFieldOptions {
  readonly placeholder?: string
  readonly clearable?: boolean
}

type Base<A extends string> = LocalsBase &
  DropdownFieldOptions & {
    readonly choices: ReadonlyArray<Choice<A>>
    readonly selected: ReadonlyArray<A>
    readonly multiselect: boolean
    readonly onSelect: (selected: ReadonlyArray<A>) => void
  }

export const clearing = (l: { readonly multiselect: boolean; readonly clearable?: boolean }) =>
  l.multiselect ? {} : { clearable: l.clearable ?? true }

const view = <A extends string>(l: Base<A>): ReactNode => (
  <Field
    {...(l.label === undefined ? {} : { label: l.label })}
    required={l.required}
    validationState={l.hasError ? 'error' : 'none'}
    {...(l.error === undefined ? {} : { validationMessage: l.error })}
  >
    <Dropdown
      id={l.id}
      name={l.name}
      multiselect={l.multiselect}
      {...clearing(l)}
      value={l.choices
        .filter(c => l.selected.includes(c.value))
        .map(c => c.text)
        .join(', ')}
      selectedOptions={[...l.selected]}
      disabled={l.disabled}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      onOptionSelect={(_e, data) =>
        l.onSelect(l.choices.filter(c => data.selectedOptions.includes(c.value)).map(c => c.value))
      }
    >
      {l.choices.map(c => (
        <Option key={c.value} value={c.value}>
          {c.text}
        </Option>
      ))}
    </Dropdown>
  </Field>
)

export const dropdownField =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<A | null, DropdownFieldOptions>): ReactNode =>
    view({
      ...l,
      choices,
      selected: l.value === null ? [] : [l.value],
      multiselect: false,
      onSelect: selected => l.onChange(selected[0] ?? null),
    })

export const dropdownFieldMulti =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<ReadonlyArray<A> | null, DropdownFieldOptions>): ReactNode =>
    view({
      ...l,
      choices,
      selected: l.value ?? [],
      multiselect: true,
      onSelect: selected => l.onChange(selected.length === 0 ? null : selected),
    })
