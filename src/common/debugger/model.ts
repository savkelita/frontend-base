import type { Option } from 'effect'

export type Model<AppModel, AppMsg> = {
  readonly app: AppModel
  readonly last: Option.Option<AppMsg>
  readonly shown: Option.Option<AppModel>
  readonly queue: ReadonlyArray<AppMsg>
}
