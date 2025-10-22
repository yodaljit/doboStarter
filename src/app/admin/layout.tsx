'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Building2,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Mail,
  CreditCard,
  Database,
  AlertTriangle
} from 'lucide-react'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Building2 },
  { name: 'Billing', href: '/admin/billing', icon: CreditCard },
  { name: 'Marketing', href: '/admin/marketing', icon: Mail },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
  { name: 'System', href: '/admin/system', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
        router.push('/dashboard')
        return
      }
      setIsAuthorized(true)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-red-600 text-white px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Super Admin Panel</span>
          </div>
          <div className="text-sm">
            Logged in as: {user?.email}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Administration</h2>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/system/health"
                className="block text-sm text-green-600 hover:text-green-800"
              >
                System Health
              </Link>
              <Link
                href="/admin/activity"
                className="block text-sm text-orange-600 hover:text-orange-800"
              >
                Recent Activity
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}