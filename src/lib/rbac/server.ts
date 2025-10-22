import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'
import { Permission, Role, hasPermission, canManageRole } from './permissions'

export interface AuthContext {
  user: any
  teamId: string
  userRole: Role
  teamMembership: any
}

/**
 * Get user authentication context including team membership and role
 */
export async function getAuthContext(
  request: NextRequest,
  teamId: string
): Promise<{ context: AuthContext | null; error: NextResponse | null }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        context: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check if user has global super_admin role using service role client to bypass RLS
    const serviceSupabase = createServiceRoleClient()
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('global_role')
      .eq('id', user.id)
      .single()

    // If user is super_admin, grant global access
    if (profile?.global_role === 'super_admin') {
      return {
        context: {
          user,
          teamId,
          userRole: 'super_admin' as Role,
          teamMembership: null // Super admins don't need team membership
        },
        error: null
      }
    }

    // Get user's team membership and role for regular users using service role to avoid RLS recursion
    const { data: teamMembership, error: membershipError } = await serviceSupabase
      .from('team_members')
      .select('role, team_id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !teamMembership) {
      return {
        context: null,
        error: NextResponse.json({ error: 'Access denied - not a team member' }, { status: 403 })
      }
    }

    return {
      context: {
        user,
        teamId,
        userRole: teamMembership.role as Role,
        teamMembership
      },
      error: null
    }
  } catch (error) {
    console.error('Auth context error:', error)
    return {
      context: null,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Check if user has required permission for the team
 */
export function checkPermission(context: AuthContext, permission: Permission): boolean {
  return hasPermission(context.userRole, permission)
}

/**
 * Check if user has any of the required permissions
 */
export function checkAnyPermission(context: AuthContext, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(context.userRole, permission))
}

/**
 * Check if user can manage a specific role
 */
export function checkCanManageRole(context: AuthContext, targetRole: Role): boolean {
  return canManageRole(context.userRole, targetRole)
}

/**
 * Middleware function to protect API routes with permission checking
 */
export function withPermission(permission: Permission) {
  return function (handler: (request: NextRequest, context: AuthContext, params: any) => Promise<NextResponse>) {
    return async function (request: NextRequest, { params }: { params: any }) {
      const resolvedParams = await params
      const teamId = resolvedParams.teamId
      
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
      }

      const { context, error } = await getAuthContext(request, teamId)
      
      if (error) return error
      if (!context) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }

      if (!hasPermission(context.userRole, permission)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      return handler(request, context, resolvedParams)
    }
  }
}

/**
 * Middleware function to protect API routes with any permission checking
 */
export function withAnyPermission(permissions: Permission[]) {
  return function (handler: (request: NextRequest, context: AuthContext, params: any) => Promise<NextResponse>) {
    return async function (request: NextRequest, { params }: { params: any }) {
      const resolvedParams = await params
      const teamId = resolvedParams.teamId
      
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
      }

      const { context, error } = await getAuthContext(request, teamId)
      
      if (error) return error
      if (!context) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }

      if (!checkAnyPermission(context, permissions)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      return handler(request, context, resolvedParams)
    }
  }
}

/**
 * Middleware function to protect API routes with role checking
 */
export function withRole(allowedRoles: Role[]) {
  return function (handler: (request: NextRequest, context: AuthContext, params: any) => Promise<NextResponse>) {
    return async function (request: NextRequest, { params }: { params: any }) {
      const resolvedParams = await params
      const teamId = resolvedParams.teamId
      
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
      }

      const { context, error } = await getAuthContext(request, teamId)
      
      if (error) return error
      if (!context) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }

      if (!allowedRoles.includes(context.userRole)) {
        return NextResponse.json({ error: 'Insufficient role permissions' }, { status: 403 })
      }

      return handler(request, context, resolvedParams)
    }
  }
}

/**
 * Get team ownership context (for routes that don't require teamId in params)
 */
export async function getTeamOwnershipContext(
  request: NextRequest,
  teamId: string
): Promise<{ isOwner: boolean; context: AuthContext | null; error: NextResponse | null }> {
  const { context, error } = await getAuthContext(request, teamId)
  
  if (error || !context) {
    return { isOwner: false, context, error }
  }

  return {
    isOwner: context.userRole === 'owner',
    context,
    error: null
  }
}