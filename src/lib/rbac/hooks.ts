import { useAuth } from '@/lib/auth/context'
import { Permission, Role, hasPermission, hasAnyPermission, hasAllPermissions, canManageRole } from './permissions'

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { userRole } = useAuth()
  
  if (!userRole) return false
  
  return hasPermission(userRole as Role, permission)
}

/**
 * Hook to check if the current user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { userRole } = useAuth()
  
  if (!userRole) return false
  
  return hasAnyPermission(userRole as Role, permissions)
}

/**
 * Hook to check if the current user has all of the specified permissions
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const { userRole } = useAuth()
  
  if (!userRole) return false
  
  return hasAllPermissions(userRole as Role, permissions)
}

/**
 * Hook to check if the current user can manage a specific role
 */
export function useCanManageRole(targetRole: Role): boolean {
  const { userRole } = useAuth()
  
  if (!userRole) return false
  
  return canManageRole(userRole as Role, targetRole)
}

/**
 * Hook to get the current user's role
 */
export function useUserRole(): Role | null {
  const { userRole } = useAuth()
  return userRole as Role | null
}

/**
 * Hook to check if the current user is an owner
 */
export function useIsOwner(): boolean {
  const { userRole } = useAuth()
  return userRole === 'owner'
}

/**
 * Hook to check if the current user is an admin or owner
 */
export function useIsAdminOrOwner(): boolean {
  const { userRole } = useAuth()
  return userRole === 'admin' || userRole === 'owner'
}

/**
 * Hook to check if the current user can manage team members
 */
export function useCanManageMembers(): boolean {
  return useAnyPermission(['members:invite', 'members:update_role', 'members:remove'])
}

/**
 * Hook to check if the current user can manage team settings
 */
export function useCanManageTeam(): boolean {
  return usePermission('team:update')
}

/**
 * Hook to check if the current user can manage billing
 */
export function useCanManageBilling(): boolean {
  return usePermission('team:manage_billing')
}

/**
 * Hook to check if the current user can manage subaccounts
 */
export function useCanManageSubaccounts(): boolean {
  return useAnyPermission(['subaccounts:create', 'subaccounts:update', 'subaccounts:delete'])
}