import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditService } from '@/lib/audit/service'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { duration } = await request.json()
    const resolvedParams = await params

    // Calculate ban end date
    const banUntil = new Date()
    banUntil.setDate(banUntil.getDate() + duration)

    // Update user ban status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ banned_until: banUntil.toISOString() })
      .eq('id', resolvedParams.userId)

    if (updateError) {
      console.error('Error banning user:', updateError)
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
    }

    // Log the action
    await AuditService.logUserAction(
      'user_banned',
      resolvedParams.userId,
      undefined, // no team context for admin actions
      undefined, // no old values
      { banned_until: banUntil.toISOString(), duration },
      request
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in ban user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}