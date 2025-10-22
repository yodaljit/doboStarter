import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'

// PUT /api/teams/[teamId]/members/[memberId] - Update team member role
export const PUT = withPermissionMiddleware('members:update_role')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

    const { role } = await request.json()

    // Validate role
    const validRoles = ['member', 'admin', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the member being updated
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('role, user_id')
      .eq('id', params.memberId)
      .eq('team_id', params.teamId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Prevent changing owner role or changing role to owner
    if (targetMember.role === 'owner' || role === 'owner') {
      return NextResponse.json({ error: 'Cannot modify owner role' }, { status: 400 })
    }

    // Prevent non-owners from updating admin roles
    if (context.userRole !== 'owner' && (targetMember.role === 'admin' || role === 'admin')) {
      return NextResponse.json({ error: 'Only owners can manage admin roles' }, { status: 403 })
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', params.memberId)
      .eq('team_id', params.teamId)
      .select(`
        id,
        role,
        created_at,
        profiles!inner (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
    }

      return NextResponse.json({ member: updatedMember })
    } catch (error) {
      console.error('Team member update error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// DELETE /api/teams/[teamId]/members/[memberId] - Remove team member
export const DELETE = withPermissionMiddleware('members:remove')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

    // Get the member being removed
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('role, user_id')
      .eq('id', params.memberId)
      .eq('team_id', params.teamId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Prevent removing the owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 })
    }

    // Prevent non-owners from removing admins
    if (context.userRole !== 'owner' && targetMember.role === 'admin') {
      return NextResponse.json({ error: 'Only owners can remove admins' }, { status: 403 })
    }

    // Allow users to remove themselves (except owners)
    const isSelfRemoval = targetMember.user_id === context.user.id
    if (isSelfRemoval && targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Owners cannot remove themselves' }, { status: 400 })
    }

    // Remove team member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', params.memberId)
      .eq('team_id', context.teamId)

    if (deleteError) {
      console.error('Error removing team member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Team member removal error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)