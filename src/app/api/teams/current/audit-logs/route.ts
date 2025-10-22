import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/rbac/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get current team ID from cookies
    const cookieStore = await cookies()
    const currentTeamId = cookieStore.get('currentTeamId')?.value
    
    if (!currentTeamId) {
      return NextResponse.json({ error: 'No current team selected' }, { status: 400 })
    }

    // Get current team from auth context
    const { context, error } = await getAuthContext(request, currentTeamId)
    
    if (error) return error
    if (!context) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    const supabase = await createClient()
    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          ip_address,
          created_at,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('team_id', context.teamId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json(
          { error: 'Failed to fetch audit logs' },
          { status: 500 }
        )
      }

      return NextResponse.json(auditLogs)
    } catch (error) {
      console.error('Error in audit logs API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in audit logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}