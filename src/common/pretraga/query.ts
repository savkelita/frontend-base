import type { Direction, Sort } from './sort'

type Paging = {
  readonly offset?: number | undefined
  readonly order?: string | undefined
  readonly dir?: Direction | undefined
}

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
