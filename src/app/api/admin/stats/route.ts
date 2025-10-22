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

    // Check if user is super admin (you might want to add a super_admin field to profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    // For now, check if email is in admin list (you should implement proper role-based access)
    const adminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || []
    if (!profile || !adminEmails.includes(profile.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get total teams
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    // Get total subaccounts
    const { count: totalSubaccounts } = await supabase
      .from('subaccounts')
      .select('*', { count: 'exact', head: true })

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('team_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Calculate monthly revenue (mock data for now)
    const totalRevenue = (activeSubscriptions || 0) * 2999 // Average plan price

    // Calculate monthly growth (mock data for now)
    const monthlyGrowth = 12.5

    const stats = {
      totalUsers: totalUsers || 0,
      totalTeams: totalTeams || 0,
      totalSubaccounts: totalSubaccounts || 0,
      totalRevenue,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyGrowth
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}