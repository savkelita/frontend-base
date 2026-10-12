import { Data as Tagged } from 'effect'
import type { ApiError } from '../error'

export type Page<A> = {
  readonly rows: ReadonlyArray<A>
  readonly total: number
}

export type Data<A> = Tagged.TaggedEnum<{
  Loading: { readonly previous: Page<A> | null }
  Ready: { readonly page: Page<A> }
  Failed: { readonly error: ApiError }
}>

interface DataDefinition extends Tagged.TaggedEnum.WithGenerics<1> {
  readonly taggedEnum: Data<this['A']>
}

export const Data = Tagged.taggedEnum<DataDefinition>()

export const initial = <A>(): Data<A> => Data.Loading<A>({ previous: null })

export const page = <A>(data: Data<A>): Page<A> | null =>
  Data.$match(data, {
    Loading: ({ previous }) => previous,
    Ready: ({ page: p }) => p,
    Failed: () => null,
  })

export const rows = <A>(data: Data<A>): ReadonlyArray<A> => page(data)?.rows ?? []

export const total = <A>(data: Data<A>): number => page(data)?.total ?? 0

export const isLoading = <A>(data: Data<A>): boolean => data._tag === 'Loading'

export const next = <A>(data: Data<A>): Data<A> => Data.Loading<A>({ previous: page(data) })
