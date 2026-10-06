import { DayOfWeek } from '@fluentui/react-calendar-compat'
import { DatePicker, type CalendarStrings } from '@fluentui/react-datepicker-compat'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { format as formatDate } from '../date/api'
import { FormField } from './form-field'

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

const STRINGS: CalendarStrings = {
  months: [
    'Januar',
    'Februar',
    'Mart',
    'April',
    'Maj',
    'Jun',
    'Jul',
    'Avgust',
    'Septembar',
    'Oktobar',
    'Novembar',
    'Decembar',
  ],
  shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
  days: ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Cetvrtak', 'Petak', 'Subota'],
  shortDays: ['Ne', 'Po', 'Ut', 'Sr', 'Ce', 'Pe', 'Su'],
  goToToday: 'Idi na danasnji dan',
  prevMonthAriaLabel: 'Idi na prethodni mesec',
  nextMonthAriaLabel: 'Idi na sledeci mesec',
  prevYearAriaLabel: 'Idi na prethodnu godinu',
  nextYearAriaLabel: 'Idi na sledecu godinu',
  prevYearRangeAriaLabel: 'Prethodni opseg godina',
  nextYearRangeAriaLabel: 'Sledeci opseg godina',
  monthPickerHeaderAriaLabel: '{0}, promeni godinu',
  yearPickerHeaderAriaLabel: '{0}, promeni mesec',
  closeButtonAriaLabel: 'Zatvori kalendar',
  weekNumberFormatString: 'Broj nedelje {0}',
  selectedDateFormatString: 'Izabran datum {0}',
  todayDateFormatString: 'Danasnji datum {0}',
  dayMarkedAriaLabel: 'obelezen',
}

export const kalendar = {
  formatDate: format,
  parseDateFromString: parse,
  strings: STRINGS,
  firstDayOfWeek: DayOfWeek.Monday,
  autoComplete: 'off',
}

export const dateField = (l: Locals<DateForm, DateFieldOptions>): ReactNode => (
  <FormField l={l}>
    <DatePicker
      {...kalendar}
      id={l.id}
      name={l.name}
      value={l.value}
      disabled={l.disabled}
      allowTextInput={l.allowTextInput ?? true}
      onSelectDate={date => {
        const next = date ?? null
        if (changed(next, l.value)) l.onChange(next)
      }}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      {...(l.minDate === undefined ? {} : { minDate: l.minDate })}
      {...(l.maxDate === undefined ? {} : { maxDate: l.maxDate })}
    />
  </FormField>
)
