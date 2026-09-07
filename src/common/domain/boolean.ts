import { boolField } from './factory'
import type { BaseOpts } from './factory'

// -------------------------------------------------------------------------------------
// Boolean type (backend: flag)
// -------------------------------------------------------------------------------------

export const flag = (opts: BaseOpts<boolean> = {}) => boolField(opts)
