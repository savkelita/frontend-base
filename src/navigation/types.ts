import { Data } from 'effect'
import type { ReactElement } from 'react'
import type { Permission } from '../auth/types'

export type NavigationEntry = Data.TaggedEnum<{
  NavigationLink: {
    readonly key: string
    readonly label: string
    readonly url: string
    readonly icon?: ReactElement
    readonly requiredPermissions: ReadonlyArray<Permission>
  }
  NavigationGroup: {
    readonly key: string
    readonly label: string
    readonly icon?: ReactElement
    readonly children: ReadonlyArray<NavigationEntry>
    readonly requiredPermissions: ReadonlyArray<Permission>
  }
}>

export const NavigationEntry = Data.taggedEnum<NavigationEntry>()

export const navigationLink = (
  key: string,
  label: string,
  url: string,
  options?: { icon?: ReactElement; requiredPermissions?: ReadonlyArray<Permission> },
): NavigationEntry =>
  NavigationEntry.NavigationLink({
    key,
    label,
    url,
    icon: options?.icon,
    requiredPermissions: options?.requiredPermissions ?? [],
  })

export const navigationGroup = (
  key: string,
  label: string,
  children: ReadonlyArray<NavigationEntry>,
  options?: { icon?: ReactElement; requiredPermissions?: ReadonlyArray<Permission> },
): NavigationEntry =>
  NavigationEntry.NavigationGroup({
    key,
    label,
    children,
    icon: options?.icon,
    requiredPermissions: options?.requiredPermissions ?? [],
  })
