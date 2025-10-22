import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, priceId } = await request.json()

    if (!teamId || !priceId) {
      return NextResponse.json({ error: 'Team ID and price ID are required' }, { status: 400 })
    }

    // Verify user has permission to manage this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get team details
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Fetch owner profile separately using service role to avoid RLS issues
    const serviceSupabase = createServiceRoleClient()
    const { data: ownerProfile } = await serviceSupabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', team.owner_id)
      .single()

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(
      ownerProfile?.email || '',
      ownerProfile?.full_name || team.name
    )

    // Update team with Stripe customer ID
    await supabase
      .from('teams')
      .update({ stripe_customer_id: customer.id })
      .eq('id', teamId)

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${request.nextUrl.origin}/dashboard/billing?success=true`,
      cancelUrl: `${request.nextUrl.origin}/dashboard/billing?canceled=true`,
      metadata: {
        teamId,
        userId: user.id,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}