import { makeStyles, tokens } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { isList, type DateOperator, type EnumOperator, type StringOperator } from '../../pretraga/operator'
import { dateRangeControl, type DateRangeFieldOptions, type DateRangeForm } from './date-range-field'
import { dropdownControl, dropdownControlMulti, type Choice, type DropdownFieldOptions } from './dropdown-field'
import { FormField } from './form-field'
import { OperatorMenu } from './operator-menu'
import { textControl, type TextFieldOptions } from './text-field'

export type TextFilterForm = readonly [StringOperator, string] | null

const useStyles = makeStyles({
  row: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  control: {
    flex: 1,
    minWidth: 0,
  },
})

const TextFilterView = ({
  l,
  operators,
}: {
  l: Locals<TextFilterForm, TextFieldOptions>
  operators: ReadonlyArray<StringOperator>
}): ReactNode => {
  const styles = useStyles()
  const [operator, entered] = l.value ?? [operators[0] ?? 'contains', '']

  return (
    <FormField l={l}>
      <div className={styles.row}>
        {operators.length > 1 && (
          <OperatorMenu
            operators={operators}
            value={operator}
            disabled={l.disabled}
            onChange={next => l.onChange([next as StringOperator, entered])}
          />
        )}

        {textControl({
          ...l,
          className: styles.control,
          label: undefined,
          error: undefined,
          hasError: false,
          required: false,
          value: entered === '' ? null : entered,
          onChange: next => l.onChange([operator, next ?? '']),
        })}
      </div>
    </FormField>
  )
}

export const textFilterField =
  (operators: ReadonlyArray<StringOperator>) =>
  (l: Locals<TextFilterForm, TextFieldOptions>): ReactNode => <TextFilterView l={l} operators={operators} />

export type EnumFilterForm<A extends string> = readonly [EnumOperator, ...Array<A>] | null

const EnumFilterView = <A extends string>({
  l,
  operators,
  choices,
}: {
  l: Locals<EnumFilterForm<A>, DropdownFieldOptions>
  operators: ReadonlyArray<EnumOperator>
  choices: ReadonlyArray<Choice<A>>
}): ReactNode => {
  const styles = useStyles()
  const [operator, ...chosen] = l.value ?? [operators[0] ?? 'eq']

  const bare = { ...l, className: styles.control, label: undefined, error: undefined, hasError: false, required: false }

  return (
    <FormField l={l}>
      <div className={styles.row}>
        {operators.length > 1 && (
          <OperatorMenu
            operators={operators}
            value={operator}
            disabled={l.disabled}
            onChange={next =>
              l.onChange(isList(next) ? [next as EnumOperator, ...chosen] : narrowed(next as EnumOperator, chosen))
            }
          />
        )}

        {isList(operator)
          ? dropdownControlMulti(choices)({
              ...bare,
              value: chosen,
              onChange: next => l.onChange([operator, ...(next ?? [])]),
            })
          : dropdownControl(choices)({
              ...bare,
              value: chosen[0] ?? null,
              onChange: next => l.onChange(narrowed(operator, next === null ? [] : [next])),
            })}
      </div>
    </FormField>
  )
}

const narrowed = <A extends string>(operator: EnumOperator, chosen: ReadonlyArray<A>): EnumFilterForm<A> => {
  const first = chosen[0]
  return first === undefined ? [operator] : [operator, first]
}

export const enumFilterField =
  <A extends string>(operators: ReadonlyArray<EnumOperator>, choices: ReadonlyArray<Choice<A>>) =>
  (l: Locals<EnumFilterForm<A>, DropdownFieldOptions>): ReactNode => (
    <EnumFilterView l={l} operators={operators} choices={choices} />
  )

export type DateFilterForm = readonly [DateOperator, ...Array<Date>] | null

export const dateEnds = (form: DateFilterForm): DateRangeForm => {
  if (form === null) return [null, null]
  const [operator, from, to] = form
  if (operator === 'between') return [from ?? null, to ?? null]
  return operator === 'before_or_same' ? [null, from ?? null] : [from ?? null, null]
}

export const dateFromEnds = ([from, to]: DateRangeForm): DateFilterForm => {
  if (from !== null && to !== null) return ['between', from, to]
  if (from !== null) return ['after_or_same', from]
  if (to !== null) return ['before_or_same', to]
  return null
}

export const dateFilterField = (l: Locals<DateFilterForm, DateRangeFieldOptions>): ReactNode => (
  <FormField l={l}>
    {dateRangeControl({
      ...l,
      label: undefined,
      error: undefined,
      hasError: false,
      required: false,
      value: dateEnds(l.value),
      onChange: next => l.onChange(dateFromEnds(next ?? [null, null])),
    })}
  </FormField>
)
