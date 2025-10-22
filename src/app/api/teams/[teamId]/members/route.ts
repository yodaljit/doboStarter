import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'

// GET /api/teams/[teamId]/members - Get team members
export const GET = withPermissionMiddleware('members:read')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client for super_admin to bypass RLS issues
      const supabase = context.userRole === 'super_admin' 
        ? createServiceRoleClient() 
        : await createClient()

      // Get team members with profile information
      const { data: members, error } = await supabase
        .from('team_members')
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
        .eq('team_id', context.teamId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching team members:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

      return NextResponse.json({ members })
    } catch (error) {
      console.error('Team members fetch error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// POST /api/teams/[teamId]/members - Invite team member
export const POST = withPermissionMiddleware('members:invite')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

    const { email, role = 'member' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['member', 'admin', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found. They need to sign up first.' }, { status: 404 })
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', params.teamId)
      .eq('user_id', profile.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
    }

    // Add user to team
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: params.teamId,
        user_id: profile.id,
        role
      })
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

    if (memberError) {
      console.error('Error adding team member:', memberError)
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
    }

      return NextResponse.json({ member: newMember }, { status: 201 })
    } catch (error) {
      console.error('Team member invitation error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)