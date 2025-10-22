'use client'

import React from 'react'
import { Permission, Role } from './permissions'
import { usePermission, useAnyPermission, useAllPermissions, useCanManageRole } from './hooks'

interface ProtectedProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface PermissionGuardProps extends ProtectedProps {
  permission: Permission
}

interface AnyPermissionGuardProps extends ProtectedProps {
  permissions: Permission[]
}

interface AllPermissionsGuardProps extends ProtectedProps {
  permissions: Permission[]
}

interface RoleGuardProps extends ProtectedProps {
  roles: Role[]
}

interface ManageRoleGuardProps extends ProtectedProps {
  targetRole: Role
}

/**
 * Component that renders children only if user has the specified permission
 */
export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const hasRequiredPermission = usePermission(permission)
  
  if (!hasRequiredPermission) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Component that renders children only if user has any of the specified permissions
 */
export function AnyPermissionGuard({ children, permissions, fallback = null }: AnyPermissionGuardProps) {
  const hasAnyRequiredPermission = useAnyPermission(permissions)
  
  if (!hasAnyRequiredPermission) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Component that renders children only if user has all of the specified permissions
 */
export function AllPermissionsGuard({ children, permissions, fallback = null }: AllPermissionsGuardProps) {
  const hasAllRequiredPermissions = useAllPermissions(permissions)
  
  if (!hasAllRequiredPermissions) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Component that renders children only if user has one of the specified roles
 */
export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { userRole } = useAuth()
  
  if (!userRole || !roles.includes(userRole as Role)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Component that renders children only if user can manage the specified role
 */
export function ManageRoleGuard({ children, targetRole, fallback = null }: ManageRoleGuardProps) {
  const canManage = useCanManageRole(targetRole)
  
  if (!canManage) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Higher-order component that wraps a component with permission checking
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * Higher-order component that wraps a component with role checking
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  roles: Role[],
  fallback?: React.ReactNode
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <RoleGuard roles={roles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// Import useAuth here to avoid circular dependency
import { useAuth } from '@/lib/auth/context'