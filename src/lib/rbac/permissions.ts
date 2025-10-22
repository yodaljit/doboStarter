export type Role = 'super_admin' | 'owner' | 'admin' | 'member' | 'viewer'

export type Permission = 
  // Team management
  | 'team:read'
  | 'team:update'
  | 'team:delete'
  | 'team:manage_billing'
  
  // Member management
  | 'members:read'
  | 'members:invite'
  | 'members:update_role'
  | 'members:remove'
  
  // Subaccount management
  | 'subaccounts:read'
  | 'subaccounts:create'
  | 'subaccounts:update'
  | 'subaccounts:delete'
  
  // Settings
  | 'settings:read'
  | 'settings:update'
  
  // Analytics and reporting
  | 'analytics:read'
  | 'reports:read'
  | 'reports:export'

// Define permissions for each role
export const rolePermissions: Record<Role, Permission[]> = {
  super_admin: [
    // Global access to everything across all teams
    'team:read',
    'team:update',
    'team:delete',
    'team:manage_billing',
    'members:read',
    'members:invite',
    'members:update_role',
    'members:remove',
    'subaccounts:read',
    'subaccounts:create',
    'subaccounts:update',
    'subaccounts:delete',
    'settings:read',
    'settings:update',
    'analytics:read',
    'reports:read',
    'reports:export',
  ],
  owner: [
    // Full access to everything
    'team:read',
    'team:update',
    'team:delete',
    'team:manage_billing',
    'members:read',
    'members:invite',
    'members:update_role',
    'members:remove',
    'subaccounts:read',
    'subaccounts:create',
    'subaccounts:update',
    'subaccounts:delete',
    'settings:read',
    'settings:update',
    'analytics:read',
    'reports:read',
    'reports:export',
  ],
  admin: [
    // Team management (except delete and billing)
    'team:read',
    'team:update',
    'members:read',
    'members:invite',
    'members:update_role',
    'members:remove',
    'subaccounts:read',
    'subaccounts:create',
    'subaccounts:update',
    'subaccounts:delete',
    'settings:read',
    'settings:update',
    'analytics:read',
    'reports:read',
    'reports:export',
  ],
  member: [
    // Basic access
    'team:read',
    'members:read',
    'subaccounts:read',
    'subaccounts:create',
    'subaccounts:update',
    'settings:read',
    'analytics:read',
    'reports:read',
  ],
  viewer: [
    // Read-only access
    'team:read',
    'members:read',
    'subaccounts:read',
    'settings:read',
    'analytics:read',
    'reports:read',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role]
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(userRole: Role, targetRole: Role): boolean {
  // Super admins can manage everyone including other super admins
  if (userRole === 'super_admin') {
    return true
  }
  
  // Owners can manage everyone except other owners and super admins
  if (userRole === 'owner') {
    return !['owner', 'super_admin'].includes(targetRole)
  }
  
  // Admins can manage members and viewers
  if (userRole === 'admin') {
    return ['member', 'viewer'].includes(targetRole)
  }
  
  // Members and viewers cannot manage anyone
  return false
}

/**
 * Get the hierarchy level of a role (higher number = more permissions)
 */
export function getRoleLevel(role: Role): number {
  const levels = {
    viewer: 1,
    member: 2,
    admin: 3,
    owner: 4,
    super_admin: 5,
  }
  return levels[role]
}

/**
 * Check if one role is higher than another in the hierarchy
 */
export function isRoleHigher(role1: Role, role2: Role): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2)
}