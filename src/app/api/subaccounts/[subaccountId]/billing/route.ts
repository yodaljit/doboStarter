import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Mock billing data (in real implementation, this would come from Stripe/payment provider)
    const billingData = {
      id: subaccount.id,
      name: subaccount.name,
      plan: subaccount.plan || 'basic',
      status: subaccount.billing_status || 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: getPlanAmount(subaccount.plan || 'basic'),
      currency: 'usd',
      payment_method: {
        type: 'card',
        last4: '4242',
        brand: 'visa'
      },
      usage: {
        users: subaccount.user_count || 0,
        storage: Math.floor(Math.random() * 50), // Mock data
        api_calls: Math.floor(Math.random() * 10000)
      },
      limits: getPlanLimits(subaccount.plan || 'basic')
    }

    return NextResponse.json(billingData)
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getPlanAmount(plan: string): number {
  switch (plan) {
    case 'basic': return 2900 // $29.00
    case 'pro': return 9900 // $99.00
    case 'enterprise': return 29900 // $299.00
    default: return 2900
  }
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'basic':
      return { users: 10, storage: 100, api_calls: 10000 }
    case 'pro':
      return { users: 50, storage: 500, api_calls: 100000 }
    case 'enterprise':
      return { users: 200, storage: 2000, api_calls: 1000000 }
    default:
      return { users: 10, storage: 100, api_calls: 10000 }
  }
}