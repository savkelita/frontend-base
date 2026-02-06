import * as Router from 'tea-effect/Router'
import type { AuthorizationConfig } from '../auth/types'
import { hasAllPermissions, emptyAuthorization } from '../auth/types'
import { routes } from '../router/route'
import { NavigationEntry, navigationLink, navigationGroup } from './types'

// -------------------------------------------------------------------------------------
// Configuration: Declare all navigation items here
// -------------------------------------------------------------------------------------

const allEntries: ReadonlyArray<NavigationEntry> = [
  navigationLink('home', 'Home', Router.format(routes.home, {}), { requiredPermissions: ['home.view'] }),
  navigationLink('products', 'Products', Router.format(routes.products, {}), {
    requiredPermissions: ['products.view'],
  }),
]

// -------------------------------------------------------------------------------------
// Authorization filtering
// -------------------------------------------------------------------------------------

const isPermitted = (config: AuthorizationConfig, permissions: ReadonlyArray<string>): boolean =>
  permissions.length === 0 || hasAllPermissions(config, permissions)

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

// -------------------------------------------------------------------------------------
// Builders
// -------------------------------------------------------------------------------------

export const buildNavigation = (config: AuthorizationConfig): ReadonlyArray<NavigationEntry> =>
  filterEntries(config, allEntries)

export const buildPublicNavigation = (): ReadonlyArray<NavigationEntry> => filterEntries(emptyAuthorization, allEntries)
