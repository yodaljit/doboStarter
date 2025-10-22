import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'

// GET /api/teams/[teamId]/subaccounts/[subaccountId]/settings - Get subaccount settings
export const GET = withPermissionMiddleware('subaccounts:read')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

      const { data: settings, error } = await supabase
        .from('subaccount_settings')
        .select('*')
        .eq('subaccount_id', params.subaccountId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching subaccount settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
      }

      // Return default settings if none exist
      const defaultSettings = {
        api_enabled: false,
        webhook_url: null,
        rate_limit: 1000,
        allowed_domains: []
      }

      return NextResponse.json({ 
        settings: settings || defaultSettings 
      })
    } catch (error) {
      console.error('Subaccount settings fetch error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// PUT /api/teams/[teamId]/subaccounts/[subaccountId]/settings - Update subaccount settings
export const PUT = withPermissionMiddleware('subaccounts:update')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

      const { api_enabled, webhook_url, rate_limit, allowed_domains } = await request.json()

      // Verify subaccount belongs to team
      const { data: subaccount } = await supabase
        .from('subaccounts')
        .select('id')
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
        .single()

      if (!subaccount) {
        return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
      }

      // Upsert settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from('subaccount_settings')
        .upsert({
          subaccount_id: params.subaccountId,
          api_enabled: api_enabled ?? false,
          webhook_url: webhook_url || null,
          rate_limit: rate_limit || 1000,
          allowed_domains: allowed_domains || [],
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (updateError) {
        console.error('Error updating subaccount settings:', updateError)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: updatedSettings })
    } catch (error) {
      console.error('Subaccount settings update error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)