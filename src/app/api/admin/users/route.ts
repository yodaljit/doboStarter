import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all users with additional stats
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        last_sign_in_at,
        email_confirmed_at,
        banned_until
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get team counts for each user
    const userIds = users?.map(u => u.id) || []
    const { data: teamCounts } = await supabase
      .from('team_members')
      .select('user_id')
      .in('user_id', userIds)

    // Get subscription info
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, status')
      .in('user_id', userIds)

    // Combine data
    const usersWithStats = users?.map(user => {
      const teamCount = teamCounts?.filter(tc => tc.user_id === user.id).length || 0
      const subscription = subscriptions?.find(s => s.user_id === user.id)
      
      return {
        ...user,
        team_count: teamCount,
        subscription_status: subscription?.status || null
      }
    }) || []

    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}