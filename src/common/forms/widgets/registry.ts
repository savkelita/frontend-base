import type { ReactElement } from 'react'

// -------------------------------------------------------------------------------------
// Widget props — the uniform shape every field widget renders from
// -------------------------------------------------------------------------------------
//
// Widgets are plain components driven by these props; the forms library (src/common/forms)
// wires them from a field's derived FieldUi. (No runtime registry — fields reference
// widget components directly.)

export type WidgetProps<T = unknown> = {
  readonly label: string
  readonly value: T
  readonly errorMessage?: string
  readonly required: boolean
  readonly disabled: boolean
  readonly onChange: (value: T) => void
  readonly onBlur: () => void
  /** Widget-specific extras supplied per field (e.g. select options, input type). */
  readonly config?: Record<string, unknown>
}

export type Widget = (props: WidgetProps<any>) => ReactElement
