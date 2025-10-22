import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

export const getOrCreateStripeCustomer = async (email: string, name?: string) => {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  return await stripe.customers.create({
    email,
    name,
  })
}

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
}