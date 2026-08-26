import { Field, makeStyles, tokens } from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { changed, format, parse, type DateForm } from './date-field'

export interface DateRangeFieldOptions {
  readonly minDate?: Date
  readonly maxDate?: Date
  readonly allowTextInput?: boolean
}

export type DateRangeForm = readonly [DateForm, DateForm]

const EMPTY: DateRangeForm = [null, null]

const useStyles = makeStyles({
  row: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS,
    minWidth: 0,
    '& > *': {
      flexGrow: 1,
      flexBasis: 0,
      minWidth: 0,
    },
  },
})

const DateRangeView = ({ l }: { l: Locals<DateRangeForm | null, DateRangeFieldOptions> }): ReactNode => {
  const styles = useStyles()
  const [od, doDatuma] = l.value ?? EMPTY

  const pick = (index: 0 | 1) => (date: Date | null | undefined) => {
    const next = date ?? null
    if (!changed(next, index === 0 ? od : doDatuma)) return
    const range: DateRangeForm = index === 0 ? [next, doDatuma] : [od, next]
    l.onChange(range[0] === null && range[1] === null ? null : range)
  }

  const common = {
    disabled: l.disabled,
    formatDate: format,
    parseDateFromString: parse,
    allowTextInput: l.allowTextInput ?? true,
    ...(l.minDate === undefined ? {} : { minDate: l.minDate }),
    ...(l.maxDate === undefined ? {} : { maxDate: l.maxDate }),
  }

  return (
    <Field
      {...(l.label === undefined ? {} : { label: l.label })}
      required={l.required}
      validationState={l.hasError ? 'error' : 'none'}
      {...(l.error === undefined ? {} : { validationMessage: l.error })}
    >
      <div className={styles.row}>
        <DatePicker {...common} id={l.id} name={`${l.name}.od`} value={od} placeholder="Od" onSelectDate={pick(0)} />
        <DatePicker {...common} name={`${l.name}.do`} value={doDatuma} placeholder="Do" onSelectDate={pick(1)} />
      </div>
    </Field>
  )
}

export const dateRangeField = (l: Locals<DateRangeForm | null, DateRangeFieldOptions>): ReactNode => (
  <DateRangeView l={l} />
)
