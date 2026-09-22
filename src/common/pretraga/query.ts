import { Schema } from 'effect'
import * as Router from 'tea-effect/Router'
import { ioDirection, type Direction, type Sort } from './sort'

type Paging = {
  readonly offset?: number | undefined
  readonly order?: string | undefined
  readonly dir?: Direction | undefined
}

export const pretragaQuery = <F extends Schema.Struct.Fields & { [K in keyof Paging]?: never }, O extends string>(
  criteria: Schema.Struct<F>,
  order: Schema.Schema<O, O>,
) =>
  Schema.Struct({
    offset: Schema.optional(Router.IntFromString),
    order: Schema.optional(order),
    dir: Schema.optional(ioDirection),
    ...criteria.fields,
  })

export const toRouteQuery = <C, O extends string>(offset: number, sort: Sort<O> | null, criteria: C) => ({
  ...criteria,
  ...(offset === 0 ? {} : { offset }),
  ...(sort === null ? {} : { order: sort.attribute, dir: sort.direction }),
})

export const fromRouteQuery = <Q extends Paging>(
  query: Q,
): {
  readonly offset: number
  readonly sort: Sort<NonNullable<Q['order']>> | null
  readonly criteria: Omit<Q, keyof Paging>
} => {
  const { offset, order, dir, ...criteria } = query
  return {
    offset: offset ?? 0,
    sort: order === undefined ? null : { attribute: order as NonNullable<Q['order']>, direction: dir ?? 'ASC' },
    criteria,
  }
}
