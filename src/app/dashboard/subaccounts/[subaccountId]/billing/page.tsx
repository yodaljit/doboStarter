'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react'

interface BillingData {
  id: string
  name: string
  plan: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_start: string
  current_period_end: string
  amount: number
  currency: string
  payment_method: {
    type: string
    last4: string
    brand: string
  }
  usage: {
    users: number
    storage: number
    api_calls: number
  }
  limits: {
    users: number
    storage: number
    api_calls: number
  }
}

export default function SubaccountBillingPage() {
  const { subaccountId } = useParams()
  const { user } = useAuth()
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillingData()
  }, [subaccountId])

  const fetchBillingData = async () => {
    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/billing`)
      if (response.ok) {
        const data = await response.json()
        setBillingData(data)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = async (newPlan: string) => {
    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/billing/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      })
      
      if (response.ok) {
        fetchBillingData()
      }
    } catch (error) {
      console.error('Error updating plan:', error)
    }
  }

  const handleSuspendBilling = async () => {
    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/billing/suspend`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchBillingData()
      }
    } catch (error) {
      console.error('Error suspending billing:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'past_due': return 'bg-red-100 text-red-800'
      case 'canceled': return 'bg-gray-100 text-gray-800'
      case 'trialing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'past_due': return <AlertCircle className="h-4 w-4" />
      case 'canceled': return <AlertCircle className="h-4 w-4" />
      case 'trialing': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!billingData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Billing data not found</h2>
          <p className="text-muted-foreground mt-2">Unable to load billing information for this subaccount.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
            <p className="text-muted-foreground">
              Manage billing and subscription for {billingData.name}
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold capitalize">{billingData.plan} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  ${billingData.amount / 100} {billingData.currency.toUpperCase()} / month
                </p>
              </div>
              <Badge className={getStatusColor(billingData.status)}>
                {getStatusIcon(billingData.status)}
                <span className="ml-1 capitalize">{billingData.status}</span>
              </Badge>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Current Period</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(billingData.current_period_start).toLocaleDateString()} - {' '}
                  {new Date(billingData.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  {billingData.payment_method.brand} •••• {billingData.payment_method.last4}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage & Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.users} / {billingData.limits.users}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(billingData.usage.users / billingData.limits.users) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage (GB)</span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.storage} / {billingData.limits.storage}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(billingData.usage.storage / billingData.limits.storage) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Calls</span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.api_calls.toLocaleString()} / {billingData.limits.api_calls.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(billingData.usage.api_calls / billingData.limits.api_calls) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Management */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Management</CardTitle>
            <CardDescription>
              Change subscription plan or manage billing settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant={billingData.plan === 'basic' ? 'default' : 'outline'}
                onClick={() => handlePlanChange('basic')}
              >
                Basic Plan
                <span className="block text-xs">$29/month</span>
              </Button>
              <Button 
                variant={billingData.plan === 'pro' ? 'default' : 'outline'}
                onClick={() => handlePlanChange('pro')}
              >
                Pro Plan
                <span className="block text-xs">$99/month</span>
              </Button>
              <Button 
                variant={billingData.plan === 'enterprise' ? 'default' : 'outline'}
                onClick={() => handlePlanChange('enterprise')}
              >
                Enterprise
                <span className="block text-xs">$299/month</span>
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleSuspendBilling}>
                Suspend Billing
              </Button>
              <Button variant="outline">
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}