import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditService } from '@/lib/audit/service'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createClient()
    const { duration } = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamId = params.teamId

    // Calculate suspension end date
    let suspendedUntil = null
    if (duration !== 'permanent') {
      const now = new Date()
      switch (duration) {
        case '1d':
          suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          break
        case '7d':
          suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          break
        default:
          return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
      }
    }

    // Update team status
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        status: 'suspended',
        suspended_until: suspendedUntil?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)

    if (updateError) {
      console.error('Error suspending team:', updateError)
      return NextResponse.json({ error: 'Failed to suspend team' }, { status: 500 })
    }

    // Log the action
    await AuditService.logTeamAction(
      'team_suspended',
      teamId,
      user.id,
      teamId,
      {},
      {
        duration,
        suspended_until: suspendedUntil?.toISOString(),
        suspended_by: user.email
      },
      request
    )

    return NextResponse.json({ 
      success: true,
      message: `Team suspended ${duration === 'permanent' ? 'permanently' : `for ${duration}`}`
    })

  } catch (error) {
    console.error('Team suspension API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}