import type { Option } from 'effect'
import type { ApiError } from '../../../common/error'
import type { Vozac } from '../../api'

export type Model = {
  readonly vozac: Vozac
  readonly isDeleting: boolean
  readonly error: Option.Option<ApiError>
}
