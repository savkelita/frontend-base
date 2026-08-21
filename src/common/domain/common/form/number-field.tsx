import { Field, Input } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'

export interface NumberFieldOptions {
  readonly placeholder?: string
  readonly autoFocus?: boolean
}

export type NumberForm = string | null

const formatters = new Map<number, Intl.NumberFormat>()

const formatter = (decimals: number): Intl.NumberFormat => {
  const found = formatters.get(decimals)
  if (found !== undefined) return found
  const made = new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  formatters.set(decimals, made)
  return made
}

export const format = (n: number, decimals: number): string => formatter(decimals).format(n)

const GROUPED = /^-?\d{1,3}(\.\d{3})+(,\d*)?$/

export const editable = (text: string): string =>
  GROUPED.test(text.trim()) ? text.trim().replace(/\./g, '') : text.replace('.', ',')

export const normalize = (text: string): string => text.trim().replace(/\./g, '').replace(',', '.')

export const accepts = (decimals: number): RegExp => (decimals === 0 ? /^-?\d*$/ : /^-?\d*(,\d*)?$/)

export const canonical = (value: NumberForm, decimals: number): NumberForm => {
  if (value === null || value.trim() === '') return value
  const n = Number(normalize(value))
  return Number.isNaN(n) ? value : format(n, decimals)
}

export const numberField = (decimals: number) => {
  const allowed = accepts(decimals)

  return (l: Locals<NumberForm, NumberFieldOptions>): ReactNode => (
    <Field
      {...(l.label === undefined ? {} : { label: l.label })}
      required={l.required}
      validationState={l.hasError ? 'error' : 'none'}
      {...(l.error === undefined ? {} : { validationMessage: l.error })}
    >
      <Input
        id={l.id}
        name={l.name}
        type="text"
        inputMode={decimals === 0 ? 'numeric' : 'decimal'}
        value={l.value ?? ''}
        disabled={l.disabled}
        {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
        {...(l.autoFocus === undefined ? {} : { autoFocus: l.autoFocus })}
        onChange={(_e, data) => {
          const text = editable(data.value)
          if (!allowed.test(text)) return
          l.onChange(text === '' ? null : text)
        }}
        onFocus={() => {
          if (l.value === null) return
          const next = editable(l.value)
          if (next !== l.value) l.onChange(next)
        }}
        onBlur={() => {
          const next = canonical(l.value, decimals)
          if (next !== l.value) l.onChange(next)
        }}
      />
    </Field>
  )
}
