import { Field } from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import { DayOfWeek } from '@fluentui/react-calendar-compat'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'

// -------------------------------------------------------------------------------------
// Date widget
// -------------------------------------------------------------------------------------
//
// Displays the Serbian/European format dd.mm.yyyy (calendar + text input), while the
// stored value stays the canonical "YYYY-MM-DD" string the backend expects.

const pad2 = (n: number) => String(n).padStart(2, '0')

const toIso = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const fromIso = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

const formatDdMmYyyy = (date?: Date): string =>
  date ? `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}` : ''

const parseDdMmYyyy = (input: string): Date | null => {
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})\.?$/.exec(input.trim())
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return isNaN(d.getTime()) ? null : d
}

export const DateWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => (
  <Field
    label={label}
    required={required}
    validationState={errorMessage ? 'error' : 'none'}
    validationMessage={errorMessage}
  >
    <DatePicker
      style={{ width: '160px' }}
      value={value ? fromIso(value) : null}
      formatDate={formatDdMmYyyy}
      parseDateFromString={parseDdMmYyyy}
      allowTextInput
      placeholder="dd.mm.yyyy"
      disabled={disabled}
      firstDayOfWeek={DayOfWeek.Monday}
      onSelectDate={date => onChange(date ? toIso(date) : '')}
      onBlur={onBlur}
    />
  </Field>
)
