import * as Router from 'tea-effect/Router'
import type { AuthorizationConfig, Funkcionalnost } from '../auth/types'
import { emptyAuthorization, hasAllFunkcionalnosti } from '../auth/types'
import { routes } from '../router/route'
import { NavigationEntry, navigationLink, navigationGroup } from './types'

const allEntries: ReadonlyArray<NavigationEntry> = [
  navigationLink('home', 'Home', Router.format(routes.home, {})),
  navigationLink('vozaci', 'Vozaci', Router.format(routes.vozaci, {}), {
    requiredFunkcionalnosti: ['PretragaVozaca'],
  }),
  navigationLink('vozila', 'Vozila', Router.format(routes.vozila, {}), {
    requiredFunkcionalnosti: ['PretragaVozila'],
  }),
]

const isPermitted = (config: AuthorizationConfig, trazene: ReadonlyArray<Funkcionalnost>): boolean =>
  hasAllFunkcionalnosti(config, trazene)

const filterEntries = (
  config: AuthorizationConfig,
  entries: ReadonlyArray<NavigationEntry>,
): ReadonlyArray<NavigationEntry> =>
  entries.flatMap(entry =>
    NavigationEntry.$match(entry, {
      NavigationLink: link => (isPermitted(config, link.requiredFunkcionalnosti) ? [entry] : []),
      NavigationGroup: group => {
        if (!isPermitted(config, group.requiredFunkcionalnosti)) return []
        const visibleChildren = filterEntries(config, group.children)
        return visibleChildren.length > 0
          ? [
              navigationGroup(group.key, group.label, visibleChildren, {
                icon: group.icon,
                requiredFunkcionalnosti: [...group.requiredFunkcionalnosti],
              }),
            ]
          : []
      },
    }),
  )

export const buildNavigation = (config: AuthorizationConfig): ReadonlyArray<NavigationEntry> =>
  filterEntries(config, allEntries)

export const buildPublicNavigation = (): ReadonlyArray<NavigationEntry> => filterEntries(emptyAuthorization, allEntries)
