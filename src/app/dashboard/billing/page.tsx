'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Crown, Check, AlertTriangle, ExternalLink, Building2, Shield, Zap, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BillingPage() {
  const { currentTeam, userRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        '1 team',
        '5 subaccounts',
        'Basic support',
        'Core features',
      ],
      current: currentTeam?.subscription_status === null || currentTeam?.subscription_status === 'trialing',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: [
        'Unlimited teams',
        'Unlimited subaccounts',
        'Priority support',
        'Advanced features',
        'Custom integrations',
      ],
      current: currentTeam?.subscription_status === 'active' && currentTeam?.plan_id === 'pro',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Dedicated support',
        'Custom onboarding',
        'SLA guarantee',
        'Advanced security',
      ],
      current: currentTeam?.subscription_status === 'active' && currentTeam?.plan_id === 'enterprise',
    },
  ]

  const handleSubscribe = async (planId: string) => {
    if (!currentTeam) {
      setError('No team selected')
      return
    }

    if (userRole !== 'owner' && userRole !== 'admin') {
      setError('Only team owners and admins can manage billing')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          teamId: currentTeam.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!currentTeam?.stripe_customer_id) {
      setError('No billing information found')
      return
    }

    setLoading(true)
    setError('')

    try {
      // This would typically redirect to Stripe's customer portal
      // For now, we'll show a placeholder
      alert('This would redirect to Stripe Customer Portal to manage billing')
    } catch (err) {
      setError('Failed to access billing portal')
    } finally {
      setLoading(false)
    }
  }

  const canManageBilling = userRole === 'owner' || userRole === 'admin'

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your team's subscription and billing information
            </p>
          </div>
        </div>

        {/* Current subscription */}
        {currentTeam && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Current Subscription</CardTitle>
                    <CardDescription>
                      Team: {currentTeam.name}
                    </CardDescription>
                  </div>
                </div>
                {canManageBilling && currentTeam.stripe_customer_id && (
                  <Button onClick={handleManageBilling} disabled={loading} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Plan</h4>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-primary" />
                    <span className="text-lg font-semibold capitalize">
                      {currentTeam.plan_id || 'Free'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <Badge variant={currentTeam.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {currentTeam.subscription_status || 'Free'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Customer ID</h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {currentTeam.stripe_customer_id || 'Not set'}
                  </code>
                </div>
              </div>
              
              {!canManageBilling && (
                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Limited Access
                    </p>
                    <p className="text-sm text-amber-700">
                      Only team owners and admins can manage billing settings.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Subscription plans */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptionPlans.map((plan) => {
              const planIcons = {
                free: Zap,
                pro: Crown,
                enterprise: Shield
              }
              const IconComponent = planIcons[plan.id as keyof typeof planIcons] || Star
              
              return (
                <Card
                  key={plan.id}
                  className={`relative border-0 shadow-sm hover:shadow-lg transition-all duration-200 ${
                    plan.current ? 'ring-2 ring-primary shadow-lg' : ''
                  } ${plan.id === 'pro' ? 'scale-105 border-primary/20' : ''}`}
                >
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="text-xs px-3 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  {plan.id === 'pro' && !plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="secondary" className="text-xs px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold tracking-tight">
                      {formatCurrency(plan.price)}
                      <span className="text-lg font-normal text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Separator />
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-2">
                      {plan.current ? (
                        <Button className="w-full" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : plan.id === 'free' ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          Downgrade (Contact Support)
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={loading || !canManageBilling}
                          variant={plan.id === 'pro' ? 'default' : 'outline'}
                        >
                          {loading ? 'Processing...' : 'Subscribe'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Billing information */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Billing Information</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">Secure Payment Processing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your billing information is securely managed through Stripe, a trusted payment processor. 
                    Use the "Manage Billing" button above to update payment methods, view invoices, 
                    download receipts, and manage your subscription settings.
                  </p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>256-bit SSL encryption • PCI DSS compliant</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}