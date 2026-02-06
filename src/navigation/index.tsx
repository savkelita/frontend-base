import {
  Nav,
  NavDrawer,
  NavDrawerBody,
  NavCategory,
  NavCategoryItem,
  NavSubItemGroup,
  NavSubItem,
  NavItem,
} from '@fluentui/react-components'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { Model } from './model'
import { Msg, toggleDrawer } from './msg'
import { NavigationEntry } from './types'
import { buildPublicNavigation } from './config'

export type { Model }
export type { Msg }
export { toggleDrawer }

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

export const init: [Model, Cmd.Cmd<Msg>] = [
  { entries: buildPublicNavigation(), isOpen: true, openCategories: [] },
  Cmd.none,
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    ToggleDrawer: ({ isOpen }): [Model, Cmd.Cmd<Msg>] => [{ ...model, isOpen }, Cmd.none],
    ToggleCategory: ({ categoryKey }): [Model, Cmd.Cmd<Msg>] => {
      const isOpen = model.openCategories.includes(categoryKey)
      const openCategories = isOpen
        ? model.openCategories.filter(k => k !== categoryKey)
        : [...model.openCategories, categoryKey]
      return [{ ...model, openCategories }, Cmd.none]
    },
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

const renderEntry = (entry: NavigationEntry) =>
  NavigationEntry.$match(entry, {
    NavigationLink: link => (
      <NavItem key={link.key} href={link.url} value={link.key}>
        {link.label}
      </NavItem>
    ),
    NavigationGroup: group => (
      <NavCategory key={group.key} value={group.key}>
        <NavCategoryItem>{group.label}</NavCategoryItem>
        <NavSubItemGroup>
          {group.children.map(child =>
            NavigationEntry.$match(child, {
              NavigationLink: link => (
                <NavSubItem key={link.key} href={link.url} value={link.key}>
                  {link.label}
                </NavSubItem>
              ),
              NavigationGroup: () => null,
            }),
          )}
        </NavSubItemGroup>
      </NavCategory>
    ),
  })

export const view =
  (model: Model, selectedValue: string, selectedCategoryValue: Option.Option<string>): TeaReact.Html<Msg> =>
  (_dispatch: Platform.Dispatch<Msg>) => (
    <NavDrawer type="inline" open={model.isOpen}>
      <NavDrawerBody>
        <Nav
          selectedValue={selectedValue}
          selectedCategoryValue={Option.getOrUndefined(selectedCategoryValue)}
          openCategories={[...model.openCategories]}
        >
          {model.entries.map(renderEntry)}
        </Nav>
      </NavDrawerBody>
    </NavDrawer>
  )
