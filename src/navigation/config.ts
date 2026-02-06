import * as Router from 'tea-effect/Router'
import { routes } from '../router/route'
import { type NavigationEntry, navigationLink } from './types'

// -------------------------------------------------------------------------------------
// Configuration: Declare all navigation items here
// -------------------------------------------------------------------------------------

const allEntries: ReadonlyArray<NavigationEntry> = [navigationLink('home', 'Home', Router.format(routes.home, {}))]

// -------------------------------------------------------------------------------------
// Public navigation (no authorization filtering)
// -------------------------------------------------------------------------------------

export const buildPublicNavigation = (): ReadonlyArray<NavigationEntry> => allEntries
