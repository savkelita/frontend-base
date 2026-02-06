import { Option } from 'effect'
import { memo } from 'react'
import * as Html from 'tea-effect/Html'
import type * as Platform from 'tea-effect/Platform'
import * as Nav from '../../navigation'
import { navigation } from '../msg'
import type { Msg } from '../msg'

export const AppNavigation = memo(
  ({
    model,
    selectedValue,
    selectedCategoryValue: selectedCategory,
    dispatch,
  }: {
    model: Nav.Model
    selectedValue: string
    selectedCategoryValue: Option.Option<string>
    dispatch: Platform.Dispatch<Msg>
  }) => Html.map(navigation)(Nav.view(model, selectedValue, selectedCategory))(dispatch),
)
