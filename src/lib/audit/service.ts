import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  userId?: string
  teamId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          team_id: entry.teamId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          old_values: entry.oldValues,
          new_values: entry.newValues,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent
        })
    } catch (error) {
      console.error('Failed to log audit entry:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getTeamAuditLogs(teamId: string, limit = 50, offset = 0) {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
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
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  }

  static async getUserAuditLogs(userId: string, limit = 50, offset = 0) {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
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
          teams (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error)
      return []
    }
  }

  // Helper methods for common audit actions
  static async logTeamAction(
    action: string,
    teamId: string,
    userId?: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request
  ) {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     undefined
    const userAgent = request?.headers.get('user-agent') || undefined

    await this.log({
      userId,
      teamId,
      action,
      resourceType: 'team',
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    })
  }

  static async logSubaccountAction(
    action: string,
    subaccountId: string,
    teamId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request
  ) {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     undefined
    const userAgent = request?.headers.get('user-agent') || undefined

    await this.log({
      userId,
      teamId,
      action,
      resourceType: 'subaccount',
      resourceId: subaccountId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    })
  }

  static async logUserAction(
    action: string,
    userId: string,
    teamId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request
  ) {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     undefined
    const userAgent = request?.headers.get('user-agent') || undefined

    await this.log({
      userId,
      teamId,
      action,
      resourceType: 'user',
      resourceId: userId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    })
  }

  static async logInvitationAction(
    action: string,
    invitationId: string,
    teamId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request
  ) {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     undefined
    const userAgent = request?.headers.get('user-agent') || undefined

    await this.log({
      userId,
      teamId,
      action,
      resourceType: 'invitation',
      resourceId: invitationId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    })
  }
}

export const auditService = AuditService