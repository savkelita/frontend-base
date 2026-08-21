import { Field, Input } from '@fluentui/react-components'
import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'

export const POZIVNI = '3816'

export const MIN_CIFARA = 7

export const MAX_CIFARA = 8

export const PATTERN = new RegExp(`^${POZIVNI}\\d{${MIN_CIFARA},${MAX_CIFARA}}$`)

export type Form = string | null

export type TelefonFieldOptions = {
  readonly placeholder?: string
}

export const toDigits = (uneto: string): string => {
  const sve = uneto.replace(/\D/g, '')
  if (sve.length <= MAX_CIFARA) return sve
  const bez = sve.startsWith(POZIVNI)
    ? sve.slice(POZIVNI.length)
    : sve.startsWith('06')
      ? sve.slice(2)
      : sve.startsWith('6')
        ? sve.slice(1)
        : sve
  return bez.slice(0, MAX_CIFARA)
}

const prikaz = (value: Form): string =>
  value === null ? '' : value.startsWith(POZIVNI) ? value.slice(POZIVNI.length) : value

export const telefonField = (l: Locals<Form, TelefonFieldOptions>): ReactNode => (
  <Field
    {...(l.label === undefined ? {} : { label: l.label })}
    required={l.required}
    validationState={l.hasError ? 'error' : 'none'}
    {...(l.error === undefined ? {} : { validationMessage: l.error })}
  >
    <Input
      id={l.id}
      name={l.name}
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      disabled={l.disabled}
      contentBefore={`+${POZIVNI.slice(0, 3)} ${POZIVNI.slice(3)}`}
      value={prikaz(l.value)}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
      onChange={(_event, data) => {
        const cifre = toDigits(data.value)
        l.onChange(cifre === '' ? null : POZIVNI + cifre)
      }}
    />
  </Field>
)

export const vForm = Schema.String.pipe(
  Schema.pattern(PATTERN),
  Annotation.template(telefonField),
  Annotation.message((value: Form) => {
    if (value === null || value === '') return 'Podatak je obavezan'
    return PATTERN.test(value) ? undefined : `Broj mora imati ${MIN_CIFARA} ili ${MAX_CIFARA} cifara posle +381 6`
  }),
)
