'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Mail, MoreHorizontal, UserMinus, Settings, Crown, Shield, User, Eye } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface TeamMember {
  id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
}

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  member: 'bg-blue-100 text-blue-800 border-blue-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function TeamMembersPage() {
  const { user, currentTeam, userRole } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canManageMembers = userRole === 'owner' || userRole === 'admin'

  useEffect(() => {
    if (currentTeam) {
      fetchMembers()
    }
  }, [currentTeam])

  const fetchMembers = async () => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error('Error fetching members:', error)
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeam || !inviteEmail) return

    setInviteLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      const data = await response.json()
      setInviteEmail('')
      setInviteRole('member')
      setSuccess('Invitation sent successfully! They will receive an email to join the team.')
      // Refresh the members list to show any updates
      fetchMembers()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member role')
      }

      const data = await response.json()
      setMembers(members.map(member => 
        member.id === memberId ? data.member : member
      ))
      setSuccess('Member role updated successfully!')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      setMembers(members.filter(member => member.id !== memberId))
      setSuccess('Member removed successfully!')
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading team members...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600">Manage your team members and their roles</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Invite Member Form */}
        {canManageMembers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Invite new members to join your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    {userRole === 'owner' && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Inviting...' : 'Invite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({members.length})</CardTitle>
            <CardDescription>
              Current members of your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                const isCurrentUser = member.profiles.id === user?.id
                const canModifyMember = canManageMembers && 
                  member.role !== 'owner' && 
                  !isCurrentUser &&
                  (userRole === 'owner' || member.role !== 'admin')

                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles.avatar_url || ''} />
                        <AvatarFallback>
                          {member.profiles.full_name?.charAt(0) || member.profiles.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.profiles.full_name || member.profiles.email}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.profiles.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={`flex items-center gap-1 ${roleColors[member.role]}`}>
                        <RoleIcon className="h-3 w-3" />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                      
                      {canModifyMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            {userRole === 'owner' && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {member.profiles.full_name || member.profiles.email} from the team? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}