import { contains, type Data, type PretragaRequest, type StringPredicate } from '../../pretraga'

export const LIMIT = 10

export type Criteria = {
  readonly id?: number
  readonly unetaVrednost?: StringPredicate
}

export type Request = PretragaRequest<Criteria, never>

export type Model<A> = {
  readonly open: boolean
  readonly input: string
  readonly seq: number
  readonly filter: string | null
  readonly data: Data<A> | null
}

export const empty = <A>(): Model<A> => ({ open: false, input: '', seq: 0, filter: null, data: null })

export const toRequest = (filter: string | null, offset: number, id?: number): Request => ({
  criteria: { ...(id === undefined ? {} : { id }), unetaVrednost: contains(filter) },
  order_: [],
  limit_: LIMIT,
  offset_: offset,
})
