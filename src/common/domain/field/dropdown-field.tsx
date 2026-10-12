import { Dropdown, Option, makeStyles } from '@fluentui/react-components'
import type { Locals, LocalsBase } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { FormField } from './form-field'

export interface Choice<A> {
  readonly value: A
  readonly text: string
}

export interface DropdownFieldOptions {
  readonly className?: string
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

const useStyles = makeStyles({
  truncated: {
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
})

export const clearing = (l: { readonly multiselect: boolean; readonly clearable?: boolean }) =>
  l.multiselect ? {} : { clearable: l.clearable ?? true }

const Control = <A extends string>(l: Base<A>): ReactNode => {
  const styles = useStyles()
  const text = l.choices
    .filter(c => l.selected.includes(c.value))
    .map(c => c.text)
    .join(', ')

  return (
    <Dropdown
      {...(l.className === undefined ? {} : { className: l.className })}
      {...(text === '' ? {} : { button: <span className={styles.truncated}>{text}</span> })}
      id={l.id}
      name={l.name}
      multiselect={l.multiselect}
      {...clearing(l)}
      value={text}
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
  )
}

const control = <A extends string>(l: Base<A>): ReactNode => <Control {...l} />

const field = <A extends string>(l: Base<A>): ReactNode => <FormField l={l}>{control(l)}</FormField>

const single = <A extends string>(
  choices: ReadonlyArray<Choice<A>>,
  l: Locals<A | null, DropdownFieldOptions>,
): Base<A> => ({
  ...l,
  choices,
  selected: l.value === null ? [] : [l.value],
  multiselect: false,
  onSelect: selected => l.onChange(selected[0] ?? null),
})

const multi = <A extends string>(
  choices: ReadonlyArray<Choice<A>>,
  l: Locals<ReadonlyArray<A> | null, DropdownFieldOptions>,
): Base<A> => ({
  ...l,
  choices,
  selected: l.value ?? [],
  multiselect: true,
  onSelect: selected => l.onChange(selected.length === 0 ? null : selected),
})

export const dropdownControl =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<A | null, DropdownFieldOptions>): ReactNode =>
    control(single(choices, l))

export const dropdownControlMulti =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<ReadonlyArray<A> | null, DropdownFieldOptions>): ReactNode =>
    control(multi(choices, l))

export const dropdownField =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<A | null, DropdownFieldOptions>): ReactNode =>
    field(single(choices, l))

export const dropdownFieldMulti =
  <A extends string>(choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<ReadonlyArray<A> | null, DropdownFieldOptions>): ReactNode =>
    field(multi(choices, l))
