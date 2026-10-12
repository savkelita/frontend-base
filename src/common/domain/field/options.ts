import type { StructTemplate } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import type { DateOperator, EnumOperator, NumberOperator, StringOperator } from '../../pretraga/operator'
import type { BooleanFieldOptions } from './boolean-field'
import type { ComboFieldOptions } from './combo-field'
import type { DateFieldOptions } from './date-field'
import type { DateRangeFieldOptions } from './date-range-field'
import type { DropdownFieldOptions } from './dropdown-field'
import type { FileFieldOptions, UploadedFile } from './file-field'
import type { MultiComboFieldOptions } from './multi-combo-field'
import type { NumberFieldOptions } from './number-field'
import type { TextFieldOptions } from './text-field'

type Plain<A> = { readonly [K in keyof A]: A[K] }

type Common = {
  readonly label?: string
  readonly disabled?: boolean
}

type Written = TextFieldOptions & NumberFieldOptions

type Filled<A> = Exclude<A, null | undefined>

type Chosen<A> = [A] extends [ReadonlyArray<infer One>]
  ? [One] extends [string]
    ? DropdownFieldOptions
    : MultiComboFieldOptions<One>
  : never

type Several<A extends ReadonlyArray<unknown>> = [A[0]] extends [StringOperator]
  ? Written
  : [A[0]] extends [EnumOperator]
    ? DropdownFieldOptions
    : [A[0]] extends [NumberOperator]
      ? NumberFieldOptions
      : [A[0]] extends [DateOperator]
        ? DateRangeFieldOptions
        : [A[0]] extends [Date | null]
          ? DateRangeFieldOptions
          : Chosen<A>

type Widget<A> = [A] extends [ReadonlyArray<unknown>]
  ? Several<A>
  : [A] extends [boolean]
    ? BooleanFieldOptions
    : [A] extends [Date]
      ? DateFieldOptions
      : [A] extends [UploadedFile]
        ? FileFieldOptions
        : [A] extends [string]
          ? string extends A
            ? Written
            : DropdownFieldOptions
          : [A] extends [object]
            ? ComboFieldOptions<A>
            : Common

export type FieldOptions<A> = unknown extends A ? Readonly<Record<string, unknown>> : Plain<Common & Widget<Filled<A>>>

export type Options<V> = Plain<
  Common & {
    readonly template: StructTemplate<ReactNode, V>
    readonly fields?: { readonly [K in keyof V]?: FieldOptions<V[K]> }
  }
>
