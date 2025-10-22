import { emailService } from '@/lib/email/service'
import { EmailTemplateEngine, defaultTemplates, type EmailVariables } from '@/lib/email/templates'
import { render } from '@react-email/render'
import { TeamInvitationEmail } from '@/lib/email/templates/team-invitation'

export interface NotificationData {
  userId: string
  email: string
  type: NotificationType
  data: Record<string, any>
  teamId?: string
}

export type NotificationType = 
  | 'team_invitation'
  | 'welcome'
  | 'billing_payment_success'
  | 'billing_payment_failed'
  | 'billing_subscription_cancelled'
  | 'billing_trial_ending'
  | 'team_member_added'
  | 'team_member_removed'
  | 'subaccount_created'
  | 'password_reset'
  | 'email_verification'

export class NotificationService {
  async sendNotification(notification: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await this.getEmailTemplate(notification.type, notification.data)
      
      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      const result = await emailService.sendEmail({
        to: notification.email,
        subject: template.subject,
        html: template.html,
      })

      // Log notification to database (implement this based on your needs)
      await this.logNotification(notification, result.success)

      return result
    } catch (error) {
      console.error('Notification service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]): Promise<{ success: boolean; results: any[] }> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    )

    const processedResults = results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: result.reason?.message || 'Unknown error' }
    )

    const allSuccessful = processedResults.every(result => result.success)

    return {
      success: allSuccessful,
      results: processedResults
    }
  }

  private async getEmailTemplate(type: NotificationType, data: Record<string, any>): Promise<{ subject: string; html: string } | null> {
    // Handle team invitation with React email template
    if (type === 'team_invitation') {
      const { inviterName, teamName, inviteUrl, role } = data
      
      if (!inviterName || !teamName || !inviteUrl || !role) {
        console.error('Missing required data for team invitation email:', data)
        return null
      }

      // Get dynamic values
      const domain = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost'
      const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || undefined
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || undefined

      const html = await render(TeamInvitationEmail({
        inviterName,
        teamName,
        inviteUrl,
        role,
        logoUrl,
        companyName,
      }))

      return {
        subject: `You've been invited to join ${teamName}`,
        html
      }
    }

    // Fall back to default templates for other notification types
    const template = defaultTemplates.find(t => t.id === type)
    if (!template) {
      return null
    }

    // Prepare variables with defaults
    const variables: EmailVariables = {
      platformName: process.env.NEXT_PUBLIC_APP_NAME || 'Platform',
      currentYear: new Date().getFullYear().toString(),
      ...data
    }

    // Render the template
    const rendered = EmailTemplateEngine.renderTemplate(template, variables)
    
    return {
      subject: rendered.subject,
      html: rendered.html
    }
  }

  private async logNotification(notification: NotificationData, success: boolean): Promise<void> {
    // TODO: Implement notification logging to database
    // This could include storing notification history, delivery status, etc.
    console.log('Notification logged:', {
      type: notification.type,
      userId: notification.userId,
      success,
      timestamp: new Date().toISOString()
    })
  }
}

export const notificationService = new NotificationService()