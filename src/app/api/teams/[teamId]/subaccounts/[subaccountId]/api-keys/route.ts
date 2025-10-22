import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'
import { randomBytes } from 'crypto'

// GET /api/teams/[teamId]/subaccounts/[subaccountId]/api-keys - Get API keys
export const GET = withPermissionMiddleware('subaccounts:read')(
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

      const { data: apiKeys, error } = await serviceSupabase
        .from('subaccount_api_keys')
        .select(`
          id,
          name,
          key_preview,
          created_at,
          last_used,
          permissions,
          created_by
        `)
        .eq('subaccount_id', params.subaccountId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching API keys:', error)
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
      }

      // Fetch creator profiles using the same service role client
      const creatorIds = [...new Set(apiKeys?.map(k => k.created_by).filter(Boolean))]
      
      let creatorProfiles: any[] = []
      if (creatorIds.length > 0) {
        const { data: profiles } = await serviceSupabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', creatorIds)
        
        creatorProfiles = profiles || []
      }

      // Add profile data to API keys
      const apiKeysWithProfiles = apiKeys?.map(apiKey => ({
        ...apiKey,
        profiles: creatorProfiles.find(p => p.id === apiKey.created_by) || null
      }))

      return NextResponse.json({ apiKeys: apiKeysWithProfiles })
    } catch (error) {
      console.error('API keys fetch error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// POST /api/teams/[teamId]/subaccounts/[subaccountId]/api-keys - Create API key
export const POST = withPermissionMiddleware('subaccounts:update')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client to avoid RLS recursion issues
      const serviceSupabase = createServiceRoleClient()

      const { name, permissions = [] } = await request.json()

      if (!name) {
        return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
      }

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

      // Generate API key
      const apiKey = `sk_${randomBytes(32).toString('hex')}`
      const keyPreview = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`

      // Hash the API key for storage (in production, use proper hashing)
      const hashedKey = Buffer.from(apiKey).toString('base64')

      const { data: newApiKey, error: createError } = await serviceSupabase
        .from('subaccount_api_keys')
        .insert({
          subaccount_id: params.subaccountId,
          name,
          key_hash: hashedKey,
          key_preview: keyPreview,
          permissions,
          created_by: context.user.id
        })
        .select(`
          id,
          name,
          key_preview,
          created_at,
          last_used,
          permissions,
          created_by
        `)
        .single()

      if (createError) {
        console.error('Error creating API key:', createError)
        return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
      }

      // Fetch creator profile using the same service role client
      const { data: creatorProfile } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', context.user.id)
        .single()

      // Add the profile data to the response
      const apiKeyWithProfile = {
        ...newApiKey,
        profiles: creatorProfile
      }

      // Return the full API key only once (for the user to copy)
      return NextResponse.json({ 
        apiKey: apiKeyWithProfile,
        fullKey: apiKey // Only returned on creation
      }, { status: 201 })
    } catch (error) {
      console.error('API key creation error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)