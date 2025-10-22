'use client'

import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Users,
  Crown,
  UserCheck,
  Building2,
  Plus,
  CreditCard,
  Settings,
  Building,
  Shield
} from 'lucide-react'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export default function DashboardPage() {
  const { user, currentTeam, teams, userRole } = useAuth()
  const router = useRouter()

  // Redirect super admins to admin panel
  useEffect(() => {
    if (user?.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
      router.push('/admin')
    }
  }, [user?.email, router])

  const stats = [
    {
      name: 'Total Teams',
      value: teams.length,
      icon: Users,
      description: 'Active teams you belong to',
    },
    {
      name: 'Current Plan',
      value: currentTeam?.subscription_status || 'Free',
      icon: Crown,
      description: 'Your current subscription plan',
    },
    {
      name: 'Team Role',
      value: userRole || 'Member',
      icon: UserCheck,
      description: 'Your role in the current team',
    },
    {
      name: 'Subaccounts',
      value: '0',
      icon: Building2,
      description: 'Managed subaccounts',
    },
  ]

  const quickActions = [
    {
      title: 'Create New Team',
      description: 'Start a new team and invite members',
      href: '/dashboard/teams/new',
      icon: Plus,
    },
    {
      title: 'Manage Billing',
      description: 'Update your subscription and billing details',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
    {
      title: 'Team Settings',
      description: 'Configure team preferences and permissions',
      href: '/dashboard/settings',
      icon: Settings,
    },
    {
      title: 'View Subaccounts',
      description: 'Manage your client subaccounts',
      href: '/dashboard/subaccounts',
      icon: Building,
    },
    ...(user?.email && SUPER_ADMIN_EMAILS.includes(user.email) ? [{
      title: 'Admin Panel',
      description: 'Access super admin dashboard and controls',
      href: '/admin',
      icon: Shield,
    }] : []),
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Here's what's happening with your teams and projects today.
          </p>
          {currentTeam && (
            <div className="mt-4 flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-background/50 rounded-full px-3 py-1 border">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{currentTeam.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const IconComponent = stat.icon
              return (
                <Card key={stat.name} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                    <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Current team info */}
        {currentTeam && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Team Details</h2>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{currentTeam.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Team information and settings
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Subscription Status</h4>
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-lg font-semibold">
                        {currentTeam.subscription_status || 'Free'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Your Role</h4>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="text-lg font-semibold">
                        {userRole || 'Member'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Team Slug</h4>
                    <div className="flex items-center space-x-2">
                      <code className="text-lg font-mono bg-muted px-2 py-1 rounded">
                        {currentTeam.slug}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Card key={action.title} className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-sm group">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-base">{action.title}</span>
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest team and project activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📊</span>
              <p>No recent activity to display</p>
              <p className="text-sm">Activity will appear here as you use the platform</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}