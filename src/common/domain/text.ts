import { stringField } from './factory'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// Text types (backend: code10 / code30 / name / desc / string)
// -------------------------------------------------------------------------------------

export type TextOpts = BaseOpts<string>

/** Short code, max 10 chars. */
export const code10 = (opts: TextOpts = {}) => stringField({ ...opts, max: 10 })

/** Code, max 30 chars. */
export const code30 = (opts: TextOpts = {}) => stringField({ ...opts, max: 30 })

/** Name, max 80 chars. */
export const name = (opts: TextOpts = {}) => stringField({ ...opts, max: 80 })

/** Description, max 255 chars. */
export const desc = (opts: TextOpts = {}) => stringField({ ...opts, max: 255 })

/** Long free text, max 4000 chars. */
export const string = (opts: TextOpts = {}) => stringField({ ...opts, max: 4000 })
