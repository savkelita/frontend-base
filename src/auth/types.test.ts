import { describe, it, expect } from 'vitest'
import { hasPermission, hasAllPermissions, emptyAuthorization } from './types'

describe('auth/types', () => {
  const config = { permissions: ['home.view', 'users.view'] }

  describe('hasPermission', () => {
    it('should return true for present permission', () => {
      expect(hasPermission(config, 'home.view')).toBe(true)
    })

    it('should return false for missing permission', () => {
      expect(hasPermission(config, 'admin.view')).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true for empty requirements', () => {
      expect(hasAllPermissions(config, [])).toBe(true)
    })

    it('should return true when all required permissions are present', () => {
      expect(hasAllPermissions(config, ['home.view', 'users.view'])).toBe(true)
    })

    it('should return false when some permissions are missing', () => {
      expect(hasAllPermissions(config, ['home.view', 'admin.view'])).toBe(false)
    })
  })

  describe('emptyAuthorization', () => {
    it('should have no permissions', () => {
      expect(emptyAuthorization.permissions).toEqual([])
    })

    it('should fail all permission checks', () => {
      expect(hasPermission(emptyAuthorization, 'home.view')).toBe(false)
    })

    it('should pass empty requirements', () => {
      expect(hasAllPermissions(emptyAuthorization, [])).toBe(true)
    })
  })
})
