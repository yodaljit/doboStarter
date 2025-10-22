'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Users, Building2, Settings, Crown, Calendar, Hash, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function TeamsPage() {
  const { user, teams, currentTeam, switchTeam, refreshTeams } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      const { team: newTeam } = await response.json()
      await refreshTeams()
      setShowCreateForm(false)
      setTeamName('')
      setTeamDescription('')
      
      // Switch to the new team
      switchTeam(newTeam.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
              <p className="text-muted-foreground">
                Manage your teams and collaborate with others
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New Team
          </Button>
        </div>

        {/* Create team form */}
        {showCreateForm && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create New Team</CardTitle>
                  <CardDescription>
                    Start a new team to collaborate with others
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name
                  </label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="teamDescription" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input
                    id="teamDescription"
                    type="text"
                    placeholder="Brief description of your team"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="h-11"
                  />
                </div>
                {error && (
                  <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="flex space-x-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Team'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError('')
                      setTeamName('')
                      setTeamDescription('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Teams grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Your Teams</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 shadow-sm group ${
                  currentTeam?.id === team.id ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => switchTeam(team.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.description && (
                          <CardDescription className="text-sm mt-1">
                            {team.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {currentTeam?.id === team.id && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Slug</span>
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {team.slug}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Crown className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {team.subscription_status || 'Free'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Created</span>
                      </div>
                      <span className="text-xs">
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={currentTeam?.id === team.id ? "default" : "outline"}
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        switchTeam(team.id)
                      }}
                    >
                      {currentTeam?.id === team.id ? 'Current Team' : 'Switch To'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Navigate to team settings
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {teams.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Users className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No teams yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first team to get started with collaboration and unlock the full potential of your workspace
              </p>
              <Button onClick={() => setShowCreateForm(true)} size="lg" className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}