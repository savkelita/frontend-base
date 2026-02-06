import { Option } from 'effect'
import { ScreenModel } from './screen-model'

export const selectedNavValue = (screenModel: ScreenModel): string =>
  ScreenModel.$match(screenModel, {
    HomeScreen: () => 'home',
    NotFoundScreen: () => '',
  })

export const selectedCategoryValue = (_screenModel: ScreenModel): Option.Option<string> => Option.none()
