import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditService } from '@/lib/audit/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subaccountId } = params

    // Get subaccount details
    const { data: subaccount, error: subaccountError } = await supabase
      .from('subaccounts')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('id', subaccountId)
      .single()

    if (subaccountError || !subaccount) {
      return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 })
    }

    // Check if user has access to this subaccount
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', subaccount.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Suspend billing by updating status
    const { error: updateError } = await supabase
      .from('subaccounts')
      .update({ 
        billing_status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', subaccountId)

    if (updateError) {
      throw updateError
    }

    // Log the action
    await AuditService.logSubaccountAction(
      'billing_suspended',
      subaccountId,
      subaccount.team_id,
      user.id,
      { billing_status: subaccount.billing_status },
      { billing_status: 'suspended' },
      request
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Billing suspended successfully' 
    })
  } catch (error) {
    console.error('Error suspending billing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}