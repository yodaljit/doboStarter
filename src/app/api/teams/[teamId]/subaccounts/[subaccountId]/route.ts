import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { withPermissionMiddleware } from '@/lib/rbac'
import type { AuthContext } from '@/lib/rbac/server'
import { generateSlug } from '@/lib/utils'

// GET /api/teams/[teamId]/subaccounts/[subaccountId] - Get specific subaccount
export const GET = withPermissionMiddleware('subaccounts:read')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client to avoid RLS recursion issues
      const serviceSupabase = createServiceRoleClient()

      const { data: subaccount, error } = await serviceSupabase
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
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
        .single()

      if (error || !subaccount) {
        return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
      }

      // Fetch creator profile using the same service role client
      const { data: creatorProfile } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', subaccount.created_by)
        .single()

      // Add the profile data to the response
      const subaccountWithProfile = {
        ...subaccount,
        profiles: creatorProfile
      }

      return NextResponse.json({ subaccount: subaccountWithProfile })
    } catch (error) {
      console.error('Subaccount fetch error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// PUT /api/teams/[teamId]/subaccounts/[subaccountId] - Update subaccount
export const PUT = withPermissionMiddleware('subaccounts:update')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client to avoid RLS recursion issues
      const serviceSupabase = createServiceRoleClient()

      const { name, description, status } = await request.json()

      // Validate status if provided
      if (status && !['active', 'inactive', 'suspended'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      // Check if subaccount exists and belongs to the team
      const { data: existingSubaccount } = await serviceSupabase
        .from('subaccounts')
        .select('id, name, slug')
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
        .single()

      if (!existingSubaccount) {
        return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
      }

      // Prepare update data
      const updateData: any = {}
      
      if (name && name !== existingSubaccount.name) {
        const newSlug = generateSlug(name)
        
        // Check if new slug already exists within the team
        if (newSlug !== existingSubaccount.slug) {
          const { data: slugExists } = await serviceSupabase
            .from('subaccounts')
            .select('id')
            .eq('team_id', context.teamId)
            .eq('slug', newSlug)
            .neq('id', params.subaccountId)
            .single()

          if (slugExists) {
            return NextResponse.json({ error: 'A subaccount with this name already exists' }, { status: 409 })
          }
        }

        updateData.name = name
        updateData.slug = newSlug
      }

      if (description !== undefined) {
        updateData.description = description
      }

      if (status) {
        updateData.status = status
      }

      // Update subaccount
      const { data: updatedSubaccount, error: updateError } = await serviceSupabase
        .from('subaccounts')
        .update(updateData)
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
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

      if (updateError) {
        console.error('Error updating subaccount:', updateError)
        return NextResponse.json({ error: 'Failed to update subaccount' }, { status: 500 })
      }

      // Fetch creator profile using the same service role client
      const { data: creatorProfile } = await serviceSupabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', updatedSubaccount.created_by)
        .single()

      // Add the profile data to the response
      const subaccountWithProfile = {
        ...updatedSubaccount,
        profiles: creatorProfile
      }

      return NextResponse.json({ subaccount: subaccountWithProfile })
    } catch (error) {
      console.error('Subaccount update error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// DELETE /api/teams/[teamId]/subaccounts/[subaccountId] - Delete subaccount
export const DELETE = withPermissionMiddleware('subaccounts:delete')(
  async (request: NextRequest, context: AuthContext, params: any) => {
    try {
      // Use service role client to avoid RLS recursion issues
      const serviceSupabase = createServiceRoleClient()

      // Check if subaccount exists and belongs to the team
      const { data: existingSubaccount } = await serviceSupabase
        .from('subaccounts')
        .select('id')
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)
        .single()

      if (!existingSubaccount) {
        return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
      }

      // Delete subaccount
      const { error: deleteError } = await serviceSupabase
        .from('subaccounts')
        .delete()
        .eq('id', params.subaccountId)
        .eq('team_id', context.teamId)

      if (deleteError) {
        console.error('Error deleting subaccount:', deleteError)
        return NextResponse.json({ error: 'Failed to delete subaccount' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Subaccount deleted successfully' })
    } catch (error) {
      console.error('Subaccount deletion error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)