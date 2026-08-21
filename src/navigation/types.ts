import { Data } from 'effect'
import type { ReactElement } from 'react'
import type { Funkcionalnost } from '../auth/types'

export type NavigationEntry = Data.TaggedEnum<{
  NavigationLink: {
    readonly key: string
    readonly label: string
    readonly url: string
    readonly icon?: ReactElement
    readonly requiredFunkcionalnosti: ReadonlyArray<Funkcionalnost>
  }
  NavigationGroup: {
    readonly key: string
    readonly label: string
    readonly icon?: ReactElement
    readonly children: ReadonlyArray<NavigationEntry>
    readonly requiredFunkcionalnosti: ReadonlyArray<Funkcionalnost>
  }
}>

export const NavigationEntry = Data.taggedEnum<NavigationEntry>()

export const navigationLink = (
  key: string,
  label: string,
  url: string,
  options?: { icon?: ReactElement; requiredFunkcionalnosti?: ReadonlyArray<Funkcionalnost> },
): NavigationEntry =>
  NavigationEntry.NavigationLink({
    key,
    label,
    url,
    icon: options?.icon,
    requiredFunkcionalnosti: options?.requiredFunkcionalnosti ?? [],
  })

export const navigationGroup = (
  key: string,
  label: string,
  children: ReadonlyArray<NavigationEntry>,
  options?: { icon?: ReactElement; requiredFunkcionalnosti?: ReadonlyArray<Funkcionalnost> },
): NavigationEntry =>
  NavigationEntry.NavigationGroup({
    key,
    label,
    children,
    icon: options?.icon,
    requiredFunkcionalnosti: options?.requiredFunkcionalnosti ?? [],
  })
