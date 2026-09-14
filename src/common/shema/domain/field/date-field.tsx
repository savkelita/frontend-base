import { Field } from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { format as formatDate } from '../date/api'

export interface DateFieldOptions {
  readonly placeholder?: string
  readonly minDate?: Date
  readonly maxDate?: Date
  readonly allowTextInput?: boolean
}

export type DateForm = Date | null

export const format = (date?: Date): string => (date === undefined ? '' : formatDate(date))

export const parse = (text: string): Date | null => {
  const m = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/)
  if (m === null) return null
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(year, month - 1, day)
  return date.getDate() === day && date.getMonth() === month - 1 ? date : null
}

export const changed = (next: DateForm, current: DateForm): boolean => next?.getTime() !== current?.getTime()

export const dateField = (l: Locals<DateForm, DateFieldOptions>): ReactNode => (
  <Field
    {...(l.label === undefined ? {} : { label: l.label })}
    required={l.required}
    validationState={l.hasError ? 'error' : 'none'}
    {...(l.error === undefined ? {} : { validationMessage: l.error })}
  >
    <DatePicker
      id={l.id}
      name={l.name}
      value={l.value}
      disabled={l.disabled}
      formatDate={format}
      parseDateFromString={parse}
      allowTextInput={l.allowTextInput ?? true}
      onSelectDate={date => {
        const next = date ?? null
        if (changed(next, l.value)) l.onChange(next)
      }}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      {...(l.minDate === undefined ? {} : { minDate: l.minDate })}
      {...(l.maxDate === undefined ? {} : { maxDate: l.maxDate })}
    />
  </Field>
)
