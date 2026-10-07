import { Input } from '@fluentui/react-components'
import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { FormField } from '../../field/form-field'

export const PREFIX = '3816'

export const MIN_DIGITS = 7

export const MAX_DIGITS = 8

export const PATTERN = new RegExp(`^${PREFIX}\\d{${MIN_DIGITS},${MAX_DIGITS}}$`)

export type Form = string | null

export type PhoneFieldOptions = {
  readonly placeholder?: string
}

export const toDigits = (entered: string): string => {
  const digits = entered.replace(/\D/g, '')
  if (digits.length <= MAX_DIGITS) return digits
  const withoutPrefix = digits.startsWith(PREFIX)
    ? digits.slice(PREFIX.length)
    : digits.startsWith('06')
      ? digits.slice(2)
      : digits.startsWith('6')
        ? digits.slice(1)
        : digits
  return withoutPrefix.slice(0, MAX_DIGITS)
}

const display = (value: Form): string =>
  value === null ? '' : value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value

export const phoneField = (l: Locals<Form, PhoneFieldOptions>): ReactNode => (
  <FormField l={l}>
    <Input
      id={l.id}
      name={l.name}
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      disabled={l.disabled}
      contentBefore={`+${PREFIX.slice(0, 3)} ${PREFIX.slice(3)}`}
      value={display(l.value)}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      onChange={(_event, data) => {
        const digits = toDigits(data.value)
        l.onChange(digits === '' ? null : PREFIX + digits)
      }}
    />
  </FormField>
)

export const vForm = Schema.String.pipe(
  Schema.pattern(PATTERN),
  Annotation.template(phoneField),
  Annotation.message((value: Form) => {
    if (value === null || value === '') return 'Podatak je obavezan'
    return PATTERN.test(value) ? undefined : `Broj mora imati ${MIN_DIGITS} ili ${MAX_DIGITS} cifara posle +381 6`
  }),
)
