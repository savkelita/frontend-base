import * as builders from './builders'
import { object } from './core/object'
import { combine } from './core/combine'
import { asyncValidated } from './core/async'
import { page } from './page'
import { dialog, confirmDialog } from './dialog'

// -------------------------------------------------------------------------------------
// @tea-effect/forms — public API
// -------------------------------------------------------------------------------------
//
// Usage:
//   const ProductForm = Form.object({
//     title: Form.name('Naziv'),
//     price: Form.decimal('Cena', { min: 0 }),
//     grupa: Form.combo({ label: 'Grupa', search, toOptions }),
//   })

export const Form = { ...builders, object, combine, asyncValidated, page, dialog, confirmDialog }

export type { FieldDef } from './core/field'
export type { AsyncConfig } from './core/async'
export type { CombineConfig, Rebind } from './core/combine'
export type { FieldRenderer, PageProps } from './page'
export type { FormDialogState, FormDialogProps, ConfirmDialogProps } from './dialog'
export type { FieldUi, FieldCtx, Issue, Severity, Mode, Async, SelectOption } from './core/types'
export type { FormModel, FormMsg, FormSpec, Config, FormCtx, Draft, Payload, FieldRule, Fields } from './core/object'
