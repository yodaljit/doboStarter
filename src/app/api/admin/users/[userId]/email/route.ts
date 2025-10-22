import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/notifications/service'
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

    const { template } = await request.json()
    const resolvedParams = await params

    // Get target user details
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', resolvedParams.userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send email based on template
    const notificationService = new NotificationService()
    
    let notificationData = {
      userId: resolvedParams.userId,
      email: targetUser.email,
      type: template as any, // We'll handle custom templates differently
      data: {
        userName: targetUser.full_name || 'User'
      }
    }

    switch (template) {
      case 'welcome':
        notificationData.type = 'welcome'
        await notificationService.sendNotification(notificationData)
        break
      case 'account_warning':
        // For custom templates, we'll use a different approach
        // This would need to be implemented in the email service
        return NextResponse.json({ error: 'Custom templates not yet implemented' }, { status: 501 })
      case 'policy_update':
        // For custom templates, we'll use a different approach
        return NextResponse.json({ error: 'Custom templates not yet implemented' }, { status: 501 })
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }

    // Log the action
    await AuditService.logUserAction(
      'admin_email_sent',
      resolvedParams.userId,
      undefined, // no team context for admin actions
      undefined, // no old values
      { template, recipient: targetUser.email },
      request
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}