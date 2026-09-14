import * as NumberDomain from '../../number'

export const DECIMALS = 2

export const MAX_INTEGER_DIGITS = 16

export type Form = NumberDomain.Form

export const vFormOf = (bounds?: NumberDomain.Bounds) => NumberDomain.vForm(DECIMALS, MAX_INTEGER_DIGITS, bounds)

export const vForm = vFormOf()
