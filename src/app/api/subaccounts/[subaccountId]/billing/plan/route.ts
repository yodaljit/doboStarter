import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditService } from '@/lib/audit/service'

export async function PUT(
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
    const { plan } = await request.json()

    if (!plan || !['basic', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

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

    // Update subaccount plan
    const { error: updateError } = await supabase
      .from('subaccounts')
      .update({ 
        plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', subaccountId)

    if (updateError) {
      throw updateError
    }

    // Log the action
    await AuditService.logSubaccountAction(
      'plan_changed',
      subaccountId,
      subaccount.team_id,
      user.id,
      { plan: subaccount.plan },
      { plan },
      request
    )

    return NextResponse.json({ 
      success: true, 
      message: `Plan updated to ${plan}` 
    })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}