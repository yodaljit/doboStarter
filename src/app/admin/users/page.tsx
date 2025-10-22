'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  Building2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  banned_until: string | null
  team_count: number
  subscription_status: string | null
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId: string, duration: number) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      })

      if (response.ok) {
        await fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error banning user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendEmail = async (userId: string, template: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      })

      if (response.ok) {
        console.log('Email sent successfully')
      }
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getUserStatus = (user: User) => {
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return { status: 'banned', color: 'bg-red-100 text-red-800' }
    }
    if (!user.email_confirmed_at) {
      return { status: 'unverified', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { status: 'active', color: 'bg-green-100 text-green-800' }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const userStatus = getUserStatus(user).status
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage platform users, view activity, and moderate accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => getUserStatus(u).status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => getUserStatus(u).status === 'unverified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Banned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => getUserStatus(u).status === 'banned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            All registered users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userStatus = getUserStatus(user)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={userStatus.color}>
                          {userStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{user.team_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.subscription_status || 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {userStatus.status === 'banned' ? (
                              <DropdownMenuItem
                                onClick={() => handleUnbanUser(user.id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setSelectedUser(user)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleSendEmail(user.id, 'welcome')}
                              disabled={actionLoading}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Select how long to ban {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => selectedUser && handleBanUser(selectedUser.id, 1)}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              Ban for 1 day
            </Button>
            <Button
              onClick={() => selectedUser && handleBanUser(selectedUser.id, 7)}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              Ban for 1 week
            </Button>
            <Button
              onClick={() => selectedUser && handleBanUser(selectedUser.id, 30)}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              Ban for 1 month
            </Button>
            <Button
              onClick={() => selectedUser && handleBanUser(selectedUser.id, 365)}
              disabled={actionLoading}
              variant="destructive"
              className="w-full"
            >
              Ban permanently
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}