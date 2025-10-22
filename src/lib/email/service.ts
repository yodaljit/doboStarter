import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private defaultFrom: string

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailData: any = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      }

      if (options.html) emailData.html = options.html
      if (options.text) emailData.text = options.text
      if (options.replyTo) emailData.replyTo = options.replyTo
      if (options.cc) emailData.cc = options.cc
      if (options.bcc) emailData.bcc = options.bcc
      if (options.attachments) emailData.attachments = options.attachments

      const result = await resend.emails.send(emailData)

      if (result.error) {
        console.error('Email sending failed:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }
    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<{ success: boolean; results: Array<{ success: boolean; messageId?: string; error?: string }> }> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
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

  async sendTemplateEmail(
    template: EmailTemplate,
    to: string | string[],
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Replace template variables
    let html = template.html
    let text = template.text || ''
    let subject = template.subject

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      html = html.replace(new RegExp(placeholder, 'g'), String(value))
      text = text.replace(new RegExp(placeholder, 'g'), String(value))
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return this.sendEmail({
      to,
      subject,
      html,
      text
    })
  }
}

export const emailService = new EmailService()