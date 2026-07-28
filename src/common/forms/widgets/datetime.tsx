import { Field, Input } from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import { DayOfWeek } from '@fluentui/react-calendar-compat'
import type { ReactElement } from 'react'
import type { WidgetProps } from './registry'
import { maskTime } from './masks'

// -------------------------------------------------------------------------------------
// DateTime widget — a DatePicker (dd.mm.yyyy) + TimePicker (HH:mm) pair
// -------------------------------------------------------------------------------------
//
// The field value is the canonical string "YYYY-MM-DDTHH:mm". It is only non-empty when
// BOTH parts are set — so the field counts as filled only when the user has entered a date
// and a time. The forms layer decodes that string to a real `Date` for the payload.

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

export const DateTimeWidget = ({
  label,
  value,
  errorMessage,
  required,
  disabled,
  onChange,
  onBlur,
}: WidgetProps<string>): ReactElement => {
  const [datePart = '', timePart = ''] = (value ?? '').split('T')
  // Keep whichever part is entered (so time can be typed before the date, and vice versa).
  // The value is complete only when both are present; the schema flags the partial state.
  const emit = (date: string, time: string) => onChange(date || time ? `${date}T${time}` : '')

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? 'error' : 'none'}
      validationMessage={errorMessage}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <DatePicker
          style={{ width: '160px' }}
          value={datePart ? fromIso(datePart) : null}
          formatDate={formatDdMmYyyy}
          parseDateFromString={parseDdMmYyyy}
          allowTextInput
          placeholder="dd.mm.yyyy"
          disabled={disabled}
          firstDayOfWeek={DayOfWeek.Monday}
          onSelectDate={date => emit(date ? toIso(date) : '', timePart)}
          onBlur={onBlur}
        />
        <Input
          style={{ width: '110px' }}
          value={timePart}
          placeholder="HH:mm"
          disabled={disabled}
          onChange={(_e, data) => emit(datePart, maskTime(data.value))}
          onBlur={onBlur}
        />
      </div>
    </Field>
  )
}
