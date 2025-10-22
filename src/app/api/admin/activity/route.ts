import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const adminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || []
    if (!profile || !adminEmails.includes(profile.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get recent user signups
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent teams
    const { data: recentTeams } = await supabase
      .from('teams')
      .select(`
        id, 
        name, 
        created_at,
        profiles:created_by (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent subscriptions
    const { data: recentSubscriptions } = await supabase
      .from('team_subscriptions')
      .select(`
        id,
        status,
        created_at,
        teams (
          name,
          profiles:created_by (
            email,
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Combine and format activity data
    const activity: Array<{
      id: string
      type: string
      description: string
      timestamp: string
      user?: {
        email: string
        name: string
      }
    }> = []

    // Add user signups
    if (recentUsers) {
      recentUsers.forEach(user => {
        activity.push({
          id: `user_${user.id}`,
          type: 'user_signup',
          description: `New user signed up`,
          timestamp: user.created_at,
          user: {
            email: user.email,
            name: user.full_name || user.email
          }
        })
      })
    }

    // Add team creations
    if (recentTeams) {
      recentTeams.forEach(team => {
        activity.push({
          id: `team_${team.id}`,
          type: 'team_created',
          description: `Team "${team.name}" was created`,
          timestamp: team.created_at,
          user: team.profiles ? {
            email: (team.profiles as any).email,
            name: (team.profiles as any).full_name || (team.profiles as any).email
          } : undefined
        })
      })
    }

    // Add subscription events
    if (recentSubscriptions) {
      recentSubscriptions.forEach(subscription => {
        activity.push({
          id: `subscription_${subscription.id}`,
          type: subscription.status === 'active' ? 'subscription_started' : 'payment_failed',
          description: `Subscription ${subscription.status} for team "${(subscription.teams as any)?.name}"`,
          timestamp: subscription.created_at,
          user: (subscription.teams as any)?.profiles ? {
            email: (subscription.teams as any).profiles.email,
            name: (subscription.teams as any).profiles.full_name || (subscription.teams as any).profiles.email
          } : undefined
        })
      })
    }

    // Sort by timestamp and limit to 20 most recent
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivity = activity.slice(0, 20)

    return NextResponse.json(recentActivity)
  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}