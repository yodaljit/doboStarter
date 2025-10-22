import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'
import { generateSlug } from '@/lib/utils'

// GET /api/teams/[teamId]/subaccounts - Get team subaccounts
export const GET = withPermissionMiddleware('subaccounts:read')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client for super_admin to bypass RLS issues
      const supabase = context.userRole === 'super_admin' 
        ? createServiceRoleClient() 
        : await createClient()

      // Get subaccounts for the team (without profiles join to avoid RLS recursion)
      const { data: subaccounts, error } = await supabase
        .from('subaccounts')
        .select(`
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at,
          created_by
        `)
        .eq('team_id', context.teamId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching subaccounts:', error)
        return NextResponse.json({ error: 'Failed to fetch subaccounts' }, { status: 500 })
      }

      // Fetch creator profiles separately using service role to avoid RLS issues
      const serviceSupabase = createServiceRoleClient()
      const creatorIds = [...new Set(subaccounts?.map(s => s.created_by).filter(Boolean))]
      
      let creatorProfiles: any[] = []
      if (creatorIds.length > 0) {
        const { data: profiles } = await serviceSupabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', creatorIds)
        
        creatorProfiles = profiles || []
      }

      // Add profile data to subaccounts
      const subaccountsWithProfiles = subaccounts?.map(subaccount => ({
        ...subaccount,
        profiles: creatorProfiles.find(p => p.id === subaccount.created_by) || null
      }))

      return NextResponse.json({ subaccounts: subaccountsWithProfiles })
    } catch (error) {
      console.error('Subaccounts fetch error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// POST /api/teams/[teamId]/subaccounts - Create new subaccount
export const POST = withPermissionMiddleware('subaccounts:create')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      const supabase = await createClient()

      const { name, description } = await request.json()

      if (!name) {
        return NextResponse.json({ error: 'Subaccount name is required' }, { status: 400 })
      }

      const slug = generateSlug(name)

      // Check if slug already exists within the team
      const { data: existingSubaccount } = await supabase
        .from('subaccounts')
        .select('id')
        .eq('team_id', context.teamId)
        .eq('slug', slug)
        .single()

      if (existingSubaccount) {
        return NextResponse.json({ error: 'A subaccount with this name already exists' }, { status: 409 })
      }

      // Create new subaccount using service role to avoid RLS recursion
      const serviceSupabase = createServiceRoleClient()
      const { data: newSubaccount, error: createError } = await serviceSupabase
        .from('subaccounts')
        .insert({
          name,
          slug,
          description,
          team_id: context.teamId,
          created_by: context.user.id,
          status: 'active'
        })
        .select(`
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at,
          created_by
        `)
        .single()

      if (createError) {
        console.error('Error creating subaccount:', createError)
        return NextResponse.json({ error: 'Failed to create subaccount' }, { status: 500 })
      }

      // Fetch creator profile separately using service role to avoid RLS issues
      const { data: creatorProfile } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', context.user.id)
        .single()

      // Add the profile data to the response
      const subaccountWithProfile = {
        ...newSubaccount,
        profiles: creatorProfile
      }

      return NextResponse.json({ subaccount: subaccountWithProfile }, { status: 201 })
    } catch (error) {
      console.error('Subaccount creation error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)