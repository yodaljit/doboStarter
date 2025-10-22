import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notificationService } from '@/lib/notifications/service'
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
    const { template } = await request.json()
    
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

    // Get team and owner information
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        owner_id
      `)
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Fetch owner profile separately using service role to avoid RLS issues
    const serviceSupabase = createServiceRoleClient()
    const { data: ownerProfileData } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', team.owner_id)
      .single()

    // Send email based on template
    let emailSent = false
    const ownerEmail = ownerProfileData?.email
    const ownerName = ownerProfileData?.full_name || 'Team Owner'

    if (!ownerEmail) {
      return NextResponse.json({ error: 'Team owner email not found' }, { status: 400 })
    }

    switch (template) {
      case 'policy_update':
        const policyNotificationData = {
          userId: team.owner_id,
          email: ownerEmail,
          type: 'welcome' as const, // Using available type
          data: {
            teamName: team.name,
            ownerName,
            updateType: 'Terms of Service',
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
        }
        await notificationService.sendNotification(policyNotificationData)
        emailSent = true
        break

      case 'account_warning':
        const warningNotificationData = {
          userId: team.owner_id,
          email: ownerEmail,
          type: 'welcome' as const, // Using available type
          data: {
            teamName: team.name,
            ownerName,
            warningType: 'Policy Violation',
            actionRequired: 'Please review your account activity'
          }
        }
        await notificationService.sendNotification(warningNotificationData)
        emailSent = true
        break

      case 'billing_reminder':
        const billingNotificationData = {
          userId: team.owner_id,
          email: ownerEmail,
          type: 'billing_payment_failed' as const, // Using available billing type
          data: {
            teamName: team.name,
            ownerName,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            amount: '$29.00'
          }
        }
        await notificationService.sendNotification(billingNotificationData)
        emailSent = true
        break

      default:
        return NextResponse.json({ error: 'Invalid email template' }, { status: 400 })
    }

    if (emailSent) {
      // Log the action
      await AuditService.logTeamAction(
        'team_email_sent',
        teamId,
        user.id,
        teamId,
        {},
        {
          template,
          recipient: ownerEmail,
          sent_by: user.email
        },
        request
      )

      return NextResponse.json({ 
        success: true,
        message: `${template} email sent to ${ownerEmail}`
      })
    }

    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })

  } catch (error) {
    console.error('Team email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}