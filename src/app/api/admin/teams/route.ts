import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get teams with owner information and stats
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        slug,
        plan,
        status,
        created_at,
        updated_at,
        owner_id
      `)
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // Fetch owner profiles separately using service role to avoid RLS issues
    const serviceSupabase = createServiceRoleClient()
    const ownerIds = [...new Set(teams?.map(t => t.owner_id).filter(Boolean))]
    
    let ownerProfiles: any[] = []
    if (ownerIds.length > 0) {
      const { data: profiles } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds)
      
      ownerProfiles = profiles || []
    }

    // Get member counts for each team
    const teamIds = teams?.map((team: any) => team.id) || []
    const { data: memberCounts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)

    // Get subaccount counts for each team
    const { data: subaccountCounts } = await supabase
      .from('subaccounts')
      .select('team_id')
      .in('team_id', teamIds)

    // Process teams data
    const processedTeams = teams?.map((team: any) => {
      const membersCount = memberCounts?.filter((m: any) => m.team_id === team.id).length || 0
      const subaccountsCount = subaccountCounts?.filter((s: any) => s.team_id === team.id).length || 0
      const ownerProfile = ownerProfiles.find(p => p.id === team.owner_id)
      
      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        plan: team.plan || 'free',
        status: team.status || 'active',
        members_count: membersCount,
        subaccounts_count: subaccountsCount,
        created_at: team.created_at,
        last_activity: team.updated_at || team.created_at,
        owner: {
          name: ownerProfile?.full_name || 'Unknown',
          email: ownerProfile?.email || 'Unknown'
        }
      }
    }) || []

    // Calculate stats
    const stats = {
      total: processedTeams.length,
      active: processedTeams.filter((t: any) => t.status === 'active').length,
      suspended: processedTeams.filter((t: any) => t.status === 'suspended').length,
      cancelled: processedTeams.filter((t: any) => t.status === 'cancelled').length
    }

    return NextResponse.json({
      teams: processedTeams,
      stats
    })

  } catch (error) {
    console.error('Admin teams API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}