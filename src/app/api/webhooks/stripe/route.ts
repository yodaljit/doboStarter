import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabase
          .from('teams')
          .update({
            subscription_id: subscription.id,
            subscription_status: subscription.status as any,
            stripe_customer_id: subscription.customer as string,
          })
          .eq('stripe_customer_id', subscription.customer)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabase
          .from('teams')
          .update({
            subscription_id: null,
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', subscription.customer)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
          await supabase
            .from('teams')
            .update({
              subscription_status: 'active',
            })
            .eq('subscription_id', (invoice as any).subscription)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
          await supabase
            .from('teams')
            .update({
              subscription_status: 'past_due',
            })
            .eq('subscription_id', (invoice as any).subscription)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}