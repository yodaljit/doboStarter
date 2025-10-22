import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/notifications/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const { password } = await request.json()

    // First, get the invitation details without requiring authentication
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        email,
        role,
        expires_at,
        accepted_at,
        teams!inner(name)
      `)
      .eq('token', params.token)
      .is('accepted_at', null)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Validate password is provided
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Check if user already exists by trying to sign them in first
    let existingUser = null
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: password,
      })
      if (!signInError && signInData.user) {
        existingUser = signInData.user
      }
    } catch (error) {
      // User doesn't exist or password is wrong, we'll handle this below
    }
    
    let user: any
    let isNewUser = false

    if (existingUser) {
      // User exists and was successfully signed in
      user = existingUser
    } else {
      // User doesn't exist, create them
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true, // Auto-confirm email for invited users
      })

      if (signUpError) {
        console.error('Error creating user:', signUpError)
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
      }

      user = signUpData.user
      isNewUser = true
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }

    // Check if user is already a member of this team
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 })
    }

    // Accept the invitation - add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (memberError) {
      console.error('Error adding team member:', memberError)
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail the request if we can't update the invitation
    }

    // Send welcome notification
    const notificationService = new NotificationService()
    await notificationService.sendNotification({
      userId: user.id,
      email: invitation.email,
      type: 'welcome',
      data: {
        userName: invitation.email,
        dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
        teamName: (invitation.teams as any).name,
      },
      teamId: invitation.team_id
    })

    return NextResponse.json({ 
      message: 'Successfully joined the team',
      team: {
        id: invitation.team_id,
        name: (invitation.teams as any).name,
        role: invitation.role,
      }
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()

    // Get invitation details (no auth required for viewing invitation)
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        teams!inner(name, description)
      `)
      .eq('token', params.token)
      .is('accepted_at', null)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        team: {
          name: (invitation.teams as any).name,
          description: (invitation.teams as any).description,
        },
        expires_at: invitation.expires_at,
      }
    })

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}