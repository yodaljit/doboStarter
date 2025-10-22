import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error in team creation:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating team for user:', user.id)

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    const slug = generateSlug(name)
    console.log('Generated slug:', slug)

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for user:', user.id, profileError)
      return NextResponse.json({ error: 'User profile not found. Please complete your profile first.' }, { status: 400 })
    }

    console.log('User profile found:', profile.id)

    // Use service role client to bypass RLS for team creation
    const adminSupabase = createServiceRoleClient()

    // Check if slug already exists
    const { data: existingTeam } = await adminSupabase
      .from('teams')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTeam) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 400 })
    }

    // Create team using service role client
    const { data: team, error: teamError } = await adminSupabase
      .from('teams')
      .insert({
        name,
        slug,
        description,
        owner_id: user.id,
      })
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      return NextResponse.json({ error: `Failed to create team: ${teamError.message}` }, { status: 500 })
    }

    // Add owner as team member using service role client
    const { error: memberError } = await adminSupabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Team member creation error:', memberError)
      // Rollback team creation
      await adminSupabase.from('teams').delete().eq('id', team.id)
      return NextResponse.json({ error: `Failed to create team membership: ${memberError.message}` }, { status: 500 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, name, slug, description } = body

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Check if user has permission to update the team (admin or owner)
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 })
    }

    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // If slug is being updated, check if it's unique
    if (slug) {
      const { data: existingTeam, error: slugCheckError } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', slug)
        .neq('id', teamId)
        .single()

      if (existingTeam) {
        return NextResponse.json({ error: 'Team slug already exists' }, { status: 400 })
      }
    }

    // Update team
    const updateData: any = { updated_at: new Date().toISOString() }
    if (name) updateData.name = name
    if (slug) updateData.slug = slug
    if (description !== undefined) updateData.description = description

    const { data: team, error: updateError } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team:', updateError)
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Team update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Check if user is the owner of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 })
    }

    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only team owners can delete teams' }, { status: 403 })
    }

    // Use service role client to bypass RLS for deletion
    const adminSupabase = createServiceRoleClient()

    // Delete team members first (due to foreign key constraints)
    const { error: membersDeleteError } = await adminSupabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)

    if (membersDeleteError) {
      console.error('Error deleting team members:', membersDeleteError)
      return NextResponse.json({ error: 'Failed to delete team members' }, { status: 500 })
    }

    // Delete the team
    const { error: teamDeleteError } = await adminSupabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (teamDeleteError) {
      console.error('Error deleting team:', teamDeleteError)
      return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Team deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teams, error } = await supabase
      .from('team_members')
      .select(`
        role,
        teams (*)
      `)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    const userTeams = teams?.map(item => ({
      ...item.teams,
      userRole: item.role
    })) || []

    return NextResponse.json({ teams: userTeams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}