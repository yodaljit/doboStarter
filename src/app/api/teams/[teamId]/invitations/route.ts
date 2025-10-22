import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notificationService } from '@/lib/notifications/service'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to invite members
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = inviteSchema.parse(body)

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingMember) {
      const { data: existingMembership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', params.teamId)
        .eq('user_id', existingMember.id)
        .single()

      if (existingMembership) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
      }
    }

    // Get team information
    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', params.teamId)
      .single()

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get inviter information
    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create invitation token
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Store invitation in database
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: params.teamId,
        email,
        role,
        invited_by: user.id,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${inviteToken}`

    await notificationService.sendNotification({
      userId: invitation.id,
      email,
      type: 'team_invitation',
      data: {
        inviterName: inviter?.full_name || inviter?.email || 'Someone',
        teamName: team.name,
        inviteUrl,
        role,
      }
    })

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email,
        role,
        expires_at: invitation.expires_at,
      }
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view invitations
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        invited_by
      `)
      .eq('team_id', params.teamId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    // Fetch inviter profiles separately using service role to avoid RLS issues
    const serviceSupabase = createServiceRoleClient()
    const inviterIds = [...new Set(invitations?.map(i => i.invited_by).filter(Boolean))]
    
    let inviterProfiles: any[] = []
    if (inviterIds.length > 0) {
      const { data: profiles } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', inviterIds)
      
      inviterProfiles = profiles || []
    }

    // Add profile data to invitations
    const invitationsWithProfiles = invitations?.map(invitation => ({
      ...invitation,
      profiles: inviterProfiles.find(p => p.id === invitation.invited_by) || null
    }))

    return NextResponse.json({ invitations: invitationsWithProfiles })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}