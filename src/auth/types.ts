export const PERMISSIONS = [
  'PretragaVozaca',
  'KreiranjeVozaca',
  'AzuriranjeVozaca',
  'BrisanjeVozaca',
  'PretragaVozila',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type AuthorizationConfig = {
  readonly permissions: ReadonlyArray<string>
}

export const emptyAuthorization: AuthorizationConfig = { permissions: [] }

export const hasPermission = (config: AuthorizationConfig, required: Permission): boolean =>
  config.permissions.includes(required)

export const hasAllPermissions = (config: AuthorizationConfig, required: ReadonlyArray<Permission>): boolean =>
  required.length === 0 || required.every(f => hasPermission(config, f))
