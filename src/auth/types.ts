export type Permission = string

export type AuthorizationConfig = {
  readonly permissions: ReadonlyArray<Permission>
}

export const emptyAuthorization: AuthorizationConfig = { permissions: [] }

export const hasPermission = (config: AuthorizationConfig, permission: Permission): boolean =>
  config.permissions.includes(permission)

export const hasAllPermissions = (config: AuthorizationConfig, required: ReadonlyArray<Permission>): boolean =>
  required.length === 0 || required.every(p => hasPermission(config, p))
