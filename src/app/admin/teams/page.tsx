'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users, Building2, CreditCard, MoreHorizontal, Ban, Mail, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Team {
  id: string
  name: string
  slug: string
  plan: string
  status: 'active' | 'suspended' | 'cancelled'
  members_count: number
  subaccounts_count: number
  created_at: string
  last_activity: string
  owner: {
    name: string
    email: string
  }
}

interface TeamStats {
  total: number
  active: number
  suspended: number
  cancelled: number
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [stats, setStats] = useState<TeamStats>({ total: 0, active: 0, suspended: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'suspend' | 'email' | null
    team: Team | null
  }>({ open: false, type: null, team: null })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendTeam = async (teamId: string, duration: string) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      })
      
      if (response.ok) {
        fetchTeams()
        setActionDialog({ open: false, type: null, team: null })
      }
    } catch (error) {
      console.error('Failed to suspend team:', error)
    }
  }

  const handleSendEmail = async (teamId: string, template: string) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      })
      
      if (response.ok) {
        setActionDialog({ open: false, type: null, team: null })
      }
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">Manage teams, subscriptions, and access across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search teams or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teams Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Subaccounts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-gray-500">/{team.slug}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{team.owner.name}</div>
                    <div className="text-sm text-gray-500">{team.owner.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getPlanColor(team.plan)}>
                    {team.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(team.status)}>
                    {team.status}
                  </Badge>
                </TableCell>
                <TableCell>{team.members_count}</TableCell>
                <TableCell>{team.subaccounts_count}</TableCell>
                <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(team.last_activity).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTeam(team)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setActionDialog({ open: true, type: 'suspend', team })}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend Team
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setActionDialog({ open: true, type: 'email', team })}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Suspend Team Dialog */}
      <Dialog 
        open={actionDialog.open && actionDialog.type === 'suspend'} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, team: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Team</DialogTitle>
            <DialogDescription>
              How long would you like to suspend {actionDialog.team?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSuspendTeam(actionDialog.team.id, '1d')}
            >
              1 Day
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSuspendTeam(actionDialog.team.id, '7d')}
            >
              7 Days
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSuspendTeam(actionDialog.team.id, '30d')}
            >
              30 Days
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSuspendTeam(actionDialog.team.id, 'permanent')}
            >
              Permanent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog 
        open={actionDialog.open && actionDialog.type === 'email'} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, team: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {actionDialog.team?.name} team owner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSendEmail(actionDialog.team.id, 'policy_update')}
            >
              Policy Update
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSendEmail(actionDialog.team.id, 'account_warning')}
            >
              Account Warning
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => actionDialog.team && handleSendEmail(actionDialog.team.id, 'billing_reminder')}
            >
              Billing Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}