'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  currentTeam: Team | null
  teams: Team[]
  userRole: string | null
  loading: boolean
  signOut: () => Promise<void>
  switchTeam: (teamId: string) => Promise<void>
  refreshTeams: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProviderClient({
  children,
  user,
  profile,
  teams,
  currentTeam,
  userRole,
}: {
  children: React.ReactNode
  user: User | null
  profile: Profile | null
  teams: Team[]
  currentTeam: Team | null
  userRole: string | null
}) {
  const [state, setState] = useState({ user, profile, teams, currentTeam, userRole })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setState({ user, profile, teams, currentTeam, userRole })
  }, [user, profile, teams, currentTeam, userRole])

  // Client-side auth fallback when server-side auth fails
  useEffect(() => {
    const handleClientAuth = async () => {
      // If server didn't detect a user, check client-side
      if (!user) {
        setLoading(true)
        
        const supabase = createClientComponentClient<Database>()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Fetch profile
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          
          // Fetch teams
          const { data: members } = await supabase
            .from('team_members')
            .select('role, teams(*)')
            .eq('user_id', session.user.id)
          
          const clientTeams = members?.map((m: any) => m.teams).filter(Boolean) || []
          const clientCurrentTeam = clientTeams[0] || null
          const clientUserRole = members?.[0]?.role || null
          
          setState({
            user: session.user,
            profile: clientProfile,
            teams: clientTeams,
            currentTeam: clientCurrentTeam,
            userRole: clientUserRole
          })
        }
        
        setLoading(false)
      }
    }

    handleClientAuth()
  }, [user]) // Only run when user changes

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/auth/signin'
  }

  const switchTeam = async (teamId: string) => {
    const team = state.teams.find(t => t.id === teamId) || null
    if (team) {
      setState(prev => ({ ...prev, currentTeam: team }))
      await fetch('/api/auth/current-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
    }
  }

  const refreshTeams = async () => {
    // Server-driven auth: trigger a server refresh
    window.location.reload()
  }

  const value: AuthContextType = {
    user: state.user,
    profile: state.profile,
    currentTeam: state.currentTeam,
    teams: state.teams,
    userRole: state.userRole,
    loading,
    signOut,
    switchTeam,
    refreshTeams,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProviderClient')
  return ctx
}

// Legacy export for backward compatibility
export { AuthProviderClient as AuthProvider }