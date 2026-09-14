import { Schema } from 'effect'

export const ioDirection = Schema.Literal('ASC', 'DESC')

export type Direction = typeof ioDirection.Type

export type Sort<O extends string = string> = {
  readonly attribute: O
  readonly direction: Direction
}

export type Order<O extends string = string> = readonly [attribute: O, direction: Direction]

export const toOrder = <O extends string>(sort: Sort<O> | null): ReadonlyArray<Order<O>> =>
  sort === null ? [] : [[sort.attribute, sort.direction]]
