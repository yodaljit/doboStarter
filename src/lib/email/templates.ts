export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

export interface EmailVariables {
  [key: string]: string
}

export class EmailTemplateEngine {
  private static replaceVariables(content: string, variables: EmailVariables): string {
    let result = content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  static renderTemplate(template: EmailTemplate, variables: EmailVariables) {
    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.htmlContent, variables),
      text: this.replaceVariables(template.textContent, variables)
    }
  }
}

// Default email templates
export const defaultTemplates: EmailTemplate[] = [
  {
    id: 'team_invitation',
    name: 'Team Invitation',
    subject: 'You\'ve been invited to join {{teamName}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>{{inviterName}} has invited you to join <strong>{{teamName}}</strong> as a {{role}}.</p>
              <p>{{teamDescription}}</p>
              <p>Click the button below to accept the invitation:</p>
              <a href="{{invitationUrl}}" class="btn">Accept Invitation</a>
              <p>If you can't click the button, copy and paste this link into your browser:</p>
              <p><a href="{{invitationUrl}}">{{invitationUrl}}</a></p>
              <p>This invitation will expire on {{expirationDate}}.</p>
              <p>Best regards,<br>The {{platformName}} Team</p>
            </div>
            <div class="footer">
              <p>© {{currentYear}} {{platformName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Team Invitation

      Hi there,

      {{inviterName}} has invited you to join {{teamName}} as a {{role}}.

      {{teamDescription}}

      To accept the invitation, visit: {{invitationUrl}}

      This invitation will expire on {{expirationDate}}.

      Best regards,
      The {{platformName}} Team

      © {{currentYear}} {{platformName}}. All rights reserved.
    `,
    variables: ['inviterName', 'teamName', 'role', 'teamDescription', 'invitationUrl', 'expirationDate', 'platformName', 'currentYear']
  },
  {
    id: 'welcome_email',
    name: 'Welcome Email',
    subject: 'Welcome to {{platformName}}!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .btn:hover { background: #1e7e34; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{platformName}}!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>Welcome to {{platformName}}! We're excited to have you on board.</p>
              <p>You've successfully joined <strong>{{teamName}}</strong> as a {{role}}.</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Explore your team dashboard</li>
                <li>Set up your profile</li>
                <li>Invite team members</li>
                <li>Create your first subaccount</li>
              </ul>
              <a href="{{dashboardUrl}}" class="btn">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The {{platformName}} Team</p>
            </div>
            <div class="footer">
              <p>© {{currentYear}} {{platformName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Welcome to {{platformName}}!

      Hi {{userName}},

      Welcome to {{platformName}}! We're excited to have you on board.

      You've successfully joined {{teamName}} as a {{role}}.

      Here's what you can do next:
      - Explore your team dashboard
      - Set up your profile
      - Invite team members
      - Create your first subaccount

      Visit your dashboard: {{dashboardUrl}}

      If you have any questions, feel free to reach out to our support team.

      Best regards,
      The {{platformName}} Team

      © {{currentYear}} {{platformName}}. All rights reserved.
    `,
    variables: ['userName', 'teamName', 'role', 'dashboardUrl', 'platformName', 'currentYear']
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your {{platformName}} password',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .btn:hover { background: #c82333; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>We received a request to reset your password for your {{platformName}} account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="{{resetUrl}}" class="btn">Reset Password</a>
              <p>If you can't click the button, copy and paste this link into your browser:</p>
              <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in {{expirationTime}}. If you didn't request this password reset, please ignore this email.
              </div>
              <p>Best regards,<br>The {{platformName}} Team</p>
            </div>
            <div class="footer">
              <p>© {{currentYear}} {{platformName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Password Reset Request

      Hi {{userName}},

      We received a request to reset your password for your {{platformName}} account.

      To reset your password, visit: {{resetUrl}}

      Security Notice: This link will expire in {{expirationTime}}. If you didn't request this password reset, please ignore this email.

      Best regards,
      The {{platformName}} Team

      © {{currentYear}} {{platformName}}. All rights reserved.
    `,
    variables: ['userName', 'resetUrl', 'expirationTime', 'platformName', 'currentYear']
  },
  {
    id: 'subscription_confirmation',
    name: 'Subscription Confirmation',
    subject: 'Your {{platformName}} subscription is confirmed',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .btn:hover { background: #1e7e34; }
            .plan-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>Thank you for subscribing to {{platformName}}! Your subscription has been confirmed.</p>
              <div class="plan-details">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> {{planName}}</p>
                <p><strong>Price:</strong> ${{planPrice}}/{{planInterval}}</p>
                <p><strong>Next billing date:</strong> {{nextBillingDate}}</p>
              </div>
              <p>You now have access to all the features included in your plan. Get started by exploring your dashboard:</p>
              <a href="{{dashboardUrl}}" class="btn">Go to Dashboard</a>
              <p>If you have any questions about your subscription, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The {{platformName}} Team</p>
            </div>
            <div class="footer">
              <p>© {{currentYear}} {{platformName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Subscription Confirmed!

      Hi {{userName}},

      Thank you for subscribing to {{platformName}}! Your subscription has been confirmed.

      Subscription Details:
      Plan: {{planName}}
      Price: ${{planPrice}}/{{planInterval}}
      Next billing date: {{nextBillingDate}}

      You now have access to all the features included in your plan. Get started by exploring your dashboard: {{dashboardUrl}}

      If you have any questions about your subscription, please don't hesitate to contact our support team.

      Best regards,
      The {{platformName}} Team

      © {{currentYear}} {{platformName}}. All rights reserved.
    `,
    variables: ['userName', 'planName', 'planPrice', 'planInterval', 'nextBillingDate', 'dashboardUrl', 'platformName', 'currentYear']
  }
]