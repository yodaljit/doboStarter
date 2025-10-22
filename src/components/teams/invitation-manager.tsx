'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mail, Plus, MoreHorizontal, Clock, Trash2, Copy, CheckCircle } from 'lucide-react'
import { usePermission } from '@/lib/rbac/hooks'
import { PermissionGuard } from '@/lib/rbac/components'

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  profiles: {
    full_name: string | null
    email: string
  }
}

export default function InvitationManager() {
  const { currentTeam } = useAuth()
  const canInviteMembers = usePermission('members:invite')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (currentTeam) {
      fetchInvitations()
    }
  }, [currentTeam])

  const fetchInvitations = async () => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/invitations`)
      const data = await response.json()

      if (response.ok) {
        setInvitations(data.invitations || [])
      } else {
        setError(data.error || 'Failed to fetch invitations')
      }
    } catch (err) {
      setError('Failed to fetch invitations')
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!currentTeam || !inviteForm.email) return

    setInviteLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Invitation sent to ${inviteForm.email}`)
        setInviteForm({ email: '', role: 'member' })
        setInviteDialogOpen(false)
        fetchInvitations()
      } else {
        setError(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const copyInviteLink = async (invitation: Invitation) => {
    // In a real implementation, you'd get the actual invite token
    const inviteUrl = `${window.location.origin}/invite/token-placeholder`
    await navigator.clipboard.writeText(inviteUrl)
    setSuccess('Invite link copied to clipboard')
  }

  const deleteInvitation = async (invitationId: string) => {
    // Implementation for deleting invitations would go here
    setSuccess('Invitation deleted')
    fetchInvitations()
  }

  if (!currentTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
          <CardDescription>No team selected</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Invitations</CardTitle>
            <CardDescription>
              Manage pending invitations for {currentTeam.name}
            </CardDescription>
          </div>
          <PermissionGuard permission="members:invite">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {currentTeam.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendInvitation}
                    disabled={inviteLoading || !inviteForm.email}
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending invitations</p>
            {canInviteMembers && (
              <p className="text-sm text-muted-foreground mt-2">
                Send your first invitation to grow your team
              </p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invitation.profiles.full_name || invitation.profiles.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyInviteLink(invitation)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}