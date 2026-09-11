export type Permission = string

export type AuthorizationConfig = {
  readonly permissions: ReadonlyArray<Permission>
}

export const emptyAuthorization: AuthorizationConfig = { permissions: [] }

export const hasPermission = (config: AuthorizationConfig, permission: Permission): boolean =>
  config.permissions.includes(permission)

export const hasAllPermissions = (config: AuthorizationConfig, required: ReadonlyArray<Permission>): boolean =>
  required.length === 0 || required.every(p => hasPermission(config, p))

/**
 * Право у облику који радње очекују: `true` или `undefined`, никад `false`.
 *
 * Затечени пројекти добијају од сервера објекат `funkcionalnosti` са присутним кључевима,
 * па њихове радње пишу `funkcionalnosti.KreiranjeArtikla` без поређења. Наш сервер шаље
 * листу; ова функција премошћава то двоје, једном, уместо да свака радња прегледа листу.
 */
export const funkcionalnost = (config: AuthorizationConfig, ime: Permission): true | undefined =>
  hasPermission(config, ime) ? true : undefined
