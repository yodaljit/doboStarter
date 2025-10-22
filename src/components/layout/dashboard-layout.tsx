'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'Members', href: '/dashboard/teams/members', icon: Users },
  { name: 'Subaccounts', href: '/dashboard/teams/subaccounts', icon: UserCheck },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, currentTeam, teams, switchTeam, signOut, userRole } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-background border-r shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">SaaS Foundation</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent 
            navigation={navigation} 
            currentTeam={currentTeam} 
            teams={teams} 
            switchTeam={switchTeam}
            userRole={userRole}
            pathname={pathname}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r">
          <div className="flex items-center px-6 py-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">SaaS Foundation</span>
            </Link>
          </div>
          
          <SidebarContent 
            navigation={navigation} 
            currentTeam={currentTeam} 
            teams={teams} 
            switchTeam={switchTeam}
            userRole={userRole}
            pathname={pathname}
          />
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Top navigation */}
          <header className="bg-background border-b px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-semibold text-foreground">
                    {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: Array<{ name: string; href: string; icon: any }>
  currentTeam: any
  teams: any[]
  switchTeam: (teamId: string) => void
  userRole: string | null
  pathname: string
  onNavigate?: () => void
}

function SidebarContent({ 
  navigation, 
  currentTeam, 
  teams, 
  switchTeam, 
  userRole, 
  pathname,
  onNavigate 
}: SidebarContentProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Team info */}
      {currentTeam && (
        <div className="px-6 py-4 border-b bg-muted/30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="text-left">
                  <p className="text-sm font-medium">{currentTeam.name}</p>
                  <p className="text-xs text-muted-foreground">{currentTeam.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {userRole}
                  </Badge>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => switchTeam(team.id)}
                  className={cn(
                    "cursor-pointer",
                    currentTeam?.id === team.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.slug}</p>
                    </div>
                    {currentTeam?.id === team.id && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={onNavigate}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}