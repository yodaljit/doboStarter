import React from 'react'
import { getCurrentUser } from '@/lib/supabase/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { AuthProviderClient } from '@/lib/auth/context'

type Profile = Database['public']['Tables']['profiles']['Row']
type Team = Database['public']['Tables']['teams']['Row']

export default async function AuthProvider({ children }: { children: React.ReactNode }) {
  let user = null
  let profile: Profile | null = null
  let teams: Team[] = []
  let currentTeam: Team | null = null
  let userRole: string | null = null

  try {
    // Use the server-side user detection
    const { user: authUser, error: userError } = await getCurrentUser()
    
    if (!userError && authUser) {
      user = authUser
      const supabase = await createClient()

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileData) {
        profile = profileData
      }

      // Use service role client to fetch teams to bypass RLS issues
      const adminSupabase = createServiceRoleClient()
      
      // Fetch user teams
      const { data: teamsData } = await adminSupabase
        .from('team_members')
        .select(`
          role,
          teams (*)
        `)
        .eq('user_id', authUser.id)

      if (teamsData) {
        teams = teamsData.map((tm: any) => tm.teams).filter(Boolean) as Team[]
        currentTeam = teams[0] || null
        
        // Get user role for current team from the same query
         if (currentTeam && teamsData.length > 0) {
           const currentTeamMember = teamsData.find((tm: any) => tm.teams?.id === currentTeam!.id)
           userRole = currentTeamMember?.role || null
         }
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    // Continue with null values
  }

  return (
    <AuthProviderClient
      user={user}
      profile={profile}
      teams={teams || []}
      currentTeam={currentTeam}
      userRole={userRole}
    >
      {children}
    </AuthProviderClient>
  )
}