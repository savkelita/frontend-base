import * as Router from 'tea-effect/Router'
import type { AuthorizationConfig, Permission } from '../auth/types'
import { emptyAuthorization, hasAllPermissions } from '../auth/types'
import { routes } from '../router/route'
import { NavigationEntry, navigationLink, navigationGroup } from './types'

const allEntries: ReadonlyArray<NavigationEntry> = [
  navigationLink('home', 'Home', Router.format(routes.home, {})),
  navigationLink('vozaci', 'Vozaci', Router.format(routes.vozaci, {}), {
    requiredPermissions: ['PretragaVozaca'],
  }),
  navigationLink('vozila', 'Vozila', Router.format(routes.vozila, {}), {
    requiredPermissions: ['PretragaVozila'],
  }),
]

const isPermitted = (config: AuthorizationConfig, required: ReadonlyArray<Permission>): boolean =>
  hasAllPermissions(config, required)

const filterEntries = (
  config: AuthorizationConfig,
  entries: ReadonlyArray<NavigationEntry>,
): ReadonlyArray<NavigationEntry> =>
  entries.flatMap(entry =>
    NavigationEntry.$match(entry, {
      NavigationLink: link => (isPermitted(config, link.requiredPermissions) ? [entry] : []),
      NavigationGroup: group => {
        if (!isPermitted(config, group.requiredPermissions)) return []
        const visibleChildren = filterEntries(config, group.children)
        return visibleChildren.length > 0
          ? [
              navigationGroup(group.key, group.label, visibleChildren, {
                icon: group.icon,
                requiredPermissions: [...group.requiredPermissions],
              }),
            ]
          : []
      },
    }),
  )

export const buildNavigation = (config: AuthorizationConfig): ReadonlyArray<NavigationEntry> =>
  filterEntries(config, allEntries)

export const buildPublicNavigation = (): ReadonlyArray<NavigationEntry> => filterEntries(emptyAuthorization, allEntries)
