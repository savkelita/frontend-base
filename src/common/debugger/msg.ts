import { Data as Tagged } from 'effect'

export type Msg<AppModel, AppMsg> = Tagged.TaggedEnum<{
  App: { readonly msg: AppMsg }
  Requested: { readonly msg: AppMsg }
  Jumped: { readonly model: AppModel }
}>

interface MsgDefinition extends Tagged.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: Msg<this['A'], this['B']>
}

export const Msg = Tagged.taggedEnum<MsgDefinition>()

export const app = <AppModel, AppMsg>(msg: AppMsg): Msg<AppModel, AppMsg> => Msg.App({ msg })

export const requested = <AppModel, AppMsg>(msg: AppMsg): Msg<AppModel, AppMsg> => Msg.Requested({ msg })

export const jumped = <AppModel, AppMsg>(model: AppModel): Msg<AppModel, AppMsg> => Msg.Jumped({ model })
