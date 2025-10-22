import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'

// DELETE /api/teams/[teamId]/subaccounts/[subaccountId]/api-keys/[apiKeyId] - Delete API key
export const DELETE = withPermissionMiddleware('subaccounts:update')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client to avoid RLS recursion issues
      const serviceSupabase = createServiceRoleClient()

      // Verify subaccount belongs to team
      const { data: subaccount } = await serviceSupabase
        .from('subaccounts')
        .select('id')
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
        .single()

      if (!subaccount) {
        return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
      }

      // Verify API key exists and belongs to the subaccount
      const { data: apiKey } = await serviceSupabase
        .from('subaccount_api_keys')
        .select('id, name')
        .eq('id', params.apiKeyId)
        .eq('subaccount_id', params.subaccountId)
        .single()

      if (!apiKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }

      // Delete the API key
      const { error: deleteError } = await serviceSupabase
        .from('subaccount_api_keys')
        .delete()
        .eq('id', params.apiKeyId)
        .eq('subaccount_id', params.subaccountId)

      if (deleteError) {
        console.error('Error deleting API key:', deleteError)
        return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'API key deleted successfully',
        deletedKey: { id: apiKey.id, name: apiKey.name }
      })
    } catch (error) {
      console.error('API key deletion error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)