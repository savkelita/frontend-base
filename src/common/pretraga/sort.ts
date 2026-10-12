import { Array as Arr, Order, Schema } from 'effect'

export const ioDirection = Schema.Literal('ASC', 'DESC')

export type Direction = typeof ioDirection.Type

export type Sort<O extends string = string> = {
  readonly attribute: O
  readonly direction: Direction
}

export type OrderPair<O extends string = string> = readonly [attribute: O, direction: Direction]

export const toOrder = <O extends string>(sort: Sort<O> | null): ReadonlyArray<OrderPair<O>> =>
  sort === null ? [] : [[sort.attribute, sort.direction]]

export type ColumnOrder<R> = {
  readonly blank: (row: R) => boolean
  readonly value: Order.Order<R>
}

export type SortableColumn<R> = {
  readonly id: string
  readonly order?: ColumnOrder<R> | undefined
}

const missing = (value: unknown): boolean => value === null || value === undefined

const collator = new Intl.Collator('sr-Latn')

const text: Order.Order<string> = Order.make((self, that) => {
  const result = collator.compare(self, that)
  return result < 0 ? -1 : result > 0 ? 1 : 0
})

export const byText = <R>(f: (row: R) => string | null | undefined): ColumnOrder<R> => ({
  blank: row => missing(f(row)) || f(row) === '',
  value: Order.mapInput(text, (row: R) => f(row) ?? ''),
})

export const byNumber = <R>(f: (row: R) => number | null | undefined): ColumnOrder<R> => ({
  blank: row => missing(f(row)),
  value: Order.mapInput(Order.number, (row: R) => f(row) ?? 0),
})

export const byDate = <R>(f: (row: R) => Date | null | undefined): ColumnOrder<R> => ({
  blank: row => missing(f(row)),
  value: Order.mapInput(Order.number, (row: R) => f(row)?.getTime() ?? 0),
})

export const byBoolean = <R>(f: (row: R) => boolean | null | undefined): ColumnOrder<R> => ({
  blank: row => missing(f(row)),
  value: Order.mapInput(Order.boolean, (row: R) => f(row) ?? false),
})

const ordering = <R>(column: ColumnOrder<R>, direction: Direction): Order.Order<R> =>
  Order.combine(
    Order.mapInput(Order.boolean, column.blank),
    direction === 'ASC' ? column.value : Order.reverse(column.value),
  )

export const sortRows = <R>(
  rows: ReadonlyArray<R>,
  sort: Sort | null,
  columns: ReadonlyArray<SortableColumn<R>>,
): ReadonlyArray<R> => {
  const column = sort === null ? undefined : columns.find(c => c.id === sort.attribute)?.order
  return sort === null || column === undefined ? rows : Arr.sort(rows, ordering(column, sort.direction))
}
