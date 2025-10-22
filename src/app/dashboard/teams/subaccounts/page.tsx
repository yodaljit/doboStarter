'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, MoreHorizontal, Edit, Trash2, Users, Calendar, Settings } from 'lucide-react'
import { usePermission } from '@/lib/rbac/hooks'
import { PermissionGuard } from '@/lib/rbac/components'

interface Subaccount {
  id: string
  name: string
  slug: string
  description: string | null
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
  } | null
}

interface CreateSubaccountForm {
  name: string
  description: string
}

interface EditSubaccountForm {
  name: string
  description: string
  status: 'active' | 'inactive' | 'suspended'
}

export default function SubaccountsPage() {
  const { currentTeam } = useAuth()
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSubaccount, setSelectedSubaccount] = useState<Subaccount | null>(null)
  const [createForm, setCreateForm] = useState<CreateSubaccountForm>({ name: '', description: '' })
  const [editForm, setEditForm] = useState<EditSubaccountForm>({ name: '', description: '', status: 'active' })
  const [submitting, setSubmitting] = useState(false)

  const canCreate = usePermission('subaccounts:create')
  const canUpdate = usePermission('subaccounts:update')
  const canDelete = usePermission('subaccounts:delete')

  useEffect(() => {
    if (currentTeam) {
      fetchSubaccounts()
    }
  }, [currentTeam])

  const fetchSubaccounts = async () => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts`)
      if (response.ok) {
        const data = await response.json()
        setSubaccounts(data.subaccounts)
      } else {
        console.error('Failed to fetch subaccounts')
      }
    } catch (error) {
      console.error('Error fetching subaccounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubaccount = async () => {
    if (!currentTeam || !createForm.name.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSubaccounts([data.subaccount, ...subaccounts])
        setCreateForm({ name: '', description: '' })
        setCreateDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create subaccount')
      }
    } catch (error) {
      console.error('Error creating subaccount:', error)
      alert('Failed to create subaccount')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubaccount = async () => {
    if (!currentTeam || !selectedSubaccount || !editForm.name.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${selectedSubaccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          status: editForm.status,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSubaccounts(subaccounts.map(sub => 
          sub.id === selectedSubaccount.id ? data.subaccount : sub
        ))
        setEditDialogOpen(false)
        setSelectedSubaccount(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update subaccount')
      }
    } catch (error) {
      console.error('Error updating subaccount:', error)
      alert('Failed to update subaccount')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubaccount = async (subaccount: Subaccount) => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${subaccount.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSubaccounts(subaccounts.filter(sub => sub.id !== subaccount.id))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete subaccount')
      }
    } catch (error) {
      console.error('Error deleting subaccount:', error)
      alert('Failed to delete subaccount')
    }
  }

  const openEditDialog = (subaccount: Subaccount) => {
    setSelectedSubaccount(subaccount)
    setEditForm({
      name: subaccount.name,
      description: subaccount.description || '',
      status: subaccount.status,
    })
    setEditDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading subaccounts...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Subaccounts</h1>
            <p className="text-gray-600">Manage your team's subaccounts and their settings.</p>
          </div>
          <PermissionGuard permission="subaccounts:create">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subaccount
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subaccount</DialogTitle>
                  <DialogDescription>
                    Create a new subaccount for your team. This will help organize your projects and resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Enter subaccount name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Enter subaccount description (optional)"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubaccount} disabled={submitting || !createForm.name.trim()}>
                    {submitting ? 'Creating...' : 'Create Subaccount'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>

        {subaccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subaccounts yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Get started by creating your first subaccount to organize your projects and resources.
              </p>
              {canCreate && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subaccount
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subaccounts.map((subaccount) => (
              <Card key={subaccount.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{subaccount.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      /{subaccount.slug}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(subaccount.status)}>
                      {subaccount.status}
                    </Badge>
                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => window.location.href = `/dashboard/teams/subaccounts/${subaccount.id}/settings`}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                          )}
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => openEditDialog(subaccount)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subaccount</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{subaccount.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubaccount(subaccount)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {subaccount.description && (
                    <p className="text-sm text-gray-600 mb-3">{subaccount.description}</p>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {formatDate(subaccount.created_at)}
                  </div>
                  {subaccount.profiles && (
                    <div className="mt-2 text-xs text-gray-500">
                      Created by {subaccount.profiles.full_name || subaccount.profiles.email}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subaccount</DialogTitle>
              <DialogDescription>
                Update the subaccount details and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter subaccount name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter subaccount description (optional)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editForm.status} onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubaccount} disabled={submitting || !editForm.name.trim()}>
                {submitting ? 'Updating...' : 'Update Subaccount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}