'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings, Key, CreditCard, Users, Shield, Trash2, Copy, Eye, EyeOff, Plus, AlertTriangle, Loader2 } from 'lucide-react'
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
  settings?: {
    api_enabled: boolean
    webhook_url: string | null
    rate_limit: number
    allowed_domains: string[]
  }
}

interface ApiKey {
  id: string
  name: string
  key_preview: string
  created_at: string
  last_used: string | null
  permissions: string[]
}

export default function SubaccountSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { currentTeam } = useAuth()
  const [subaccount, setSubaccount] = useState<Subaccount | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form states
  const [generalForm, setGeneralForm] = useState<{
    name: string
    description: string
    status: 'active' | 'inactive' | 'suspended'
  }>({
    name: '',
    description: '',
    status: 'active'
  })
  
  const [settingsForm, setSettingsForm] = useState({
    api_enabled: false,
    webhook_url: '',
    rate_limit: 1000,
    allowed_domains: [] as string[]
  })

  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false)
  const [newApiKeyForm, setNewApiKeyForm] = useState({
    name: '',
    permissions: [] as string[]
  })
  
  // Add state for showing the created API key
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  
  // State for delete confirmation
  const [deleteApiKeyId, setDeleteApiKeyId] = useState<string | null>(null)
  const [deleteApiKeyName, setDeleteApiKeyName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canUpdate = usePermission('subaccounts:update')
  const canDelete = usePermission('subaccounts:delete')

  useEffect(() => {
    if (currentTeam && params.subaccountId) {
      fetchSubaccount()
      fetchApiKeys()
    }
  }, [currentTeam, params.subaccountId])

  const fetchSubaccount = async () => {
    if (!currentTeam || !params.subaccountId) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}`)
      const data = await response.json()

      if (response.ok) {
        setSubaccount(data.subaccount)
        setGeneralForm({
          name: data.subaccount.name,
          description: data.subaccount.description || '',
          status: data.subaccount.status
        })
        if (data.subaccount.settings) {
          setSettingsForm({
            api_enabled: data.subaccount.settings.api_enabled,
            webhook_url: data.subaccount.settings.webhook_url || '',
            rate_limit: data.subaccount.settings.rate_limit,
            allowed_domains: data.subaccount.settings.allowed_domains || []
          })
        }
      } else {
        setError(data.error || 'Failed to fetch subaccount')
      }
    } catch (err) {
      setError('Failed to fetch subaccount')
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    if (!currentTeam || !params.subaccountId) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}/api-keys`)
      const data = await response.json()

      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const updateGeneral = async () => {
    if (!currentTeam || !params.subaccountId) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSubaccount(data.subaccount)
        setSuccess('Subaccount updated successfully')
      } else {
        setError(data.error || 'Failed to update subaccount')
      }
    } catch (err) {
      setError('Failed to update subaccount')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = async () => {
    if (!currentTeam || !params.subaccountId) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Settings updated successfully')
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const createApiKey = async () => {
    if (!currentTeam || !params.subaccountId || !newApiKeyForm.name) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKeyForm),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the full API key and show it to the user
        setCreatedApiKey(data.fullKey)
        setShowApiKeyDialog(true)
        setNewApiKeyForm({ name: '', permissions: [] })
        setNewApiKeyDialog(false)
        fetchApiKeys()
      } else {
        setError(data.error || 'Failed to create API key')
      }
    } catch (err) {
      setError('Failed to create API key')
    } finally {
      setSaving(false)
    }
  }

  const copyApiKey = async () => {
    if (!createdApiKey) return
    
    try {
      await navigator.clipboard.writeText(createdApiKey)
      setApiKeyCopied(true)
      setTimeout(() => setApiKeyCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy API key:', err)
    }
  }

  const closeApiKeyDialog = () => {
    setShowApiKeyDialog(false)
    setCreatedApiKey(null)
    setApiKeyCopied(false)
  }

  const deleteApiKey = async () => {
    if (!currentTeam || !params.subaccountId || !deleteApiKeyId) return

    setDeleting(true)
    setError(null)

    // Store original list for potential rollback
    const originalApiKeys = [...apiKeys]
    
    // Optimistically remove the item from the list
    setApiKeys(prev => prev.filter(key => key.id !== deleteApiKeyId))

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}/api-keys/${deleteApiKeyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Close dialog
        setShowDeleteDialog(false)
        
        // Show success message
        setSuccess(`API key "${deleteApiKeyName}" deleted successfully`)
        
        // Reset state
        setDeleteApiKeyId(null)
        setDeleteApiKeyName('')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        // Rollback optimistic update
        setApiKeys(originalApiKeys)
        const data = await response.json()
        setError(data.error || 'Failed to delete API key')
      }
    } catch (err) {
      // Rollback optimistic update
      setApiKeys(originalApiKeys)
      setError('Failed to delete API key')
    } finally {
      setDeleting(false)
    }
  }

  const deleteSubaccount = async () => {
    if (!currentTeam || !params.subaccountId) return

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/subaccounts/${params.subaccountId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/teams/subaccounts')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete subaccount')
      }
    } catch (err) {
      setError('Failed to delete subaccount')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading subaccount settings...</div>
      </div>
    )
  }

  if (!subaccount) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Subaccount not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{subaccount.name}</h1>
          <p className="text-muted-foreground">/{subaccount.slug}</p>
        </div>
        <Badge className={subaccount.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {subaccount.status}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API & Security
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="danger">
            <Shield className="h-4 w-4 mr-2" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your subaccount's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={generalForm.name}
                  onChange={(e) => setGeneralForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!canUpdate}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={generalForm.description}
                  onChange={(e) => setGeneralForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!canUpdate}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={generalForm.status}
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                    setGeneralForm(prev => ({ ...prev, status: value }))
                  }
                  disabled={!canUpdate}
                >
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
              <PermissionGuard permission="subaccounts:update">
                <Button onClick={updateGeneral} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </PermissionGuard>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure API access and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API access for this subaccount
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.api_enabled}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, api_enabled: checked }))
                    }
                    disabled={!canUpdate}
                  />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={settingsForm.webhook_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-app.com/webhooks"
                    disabled={!canUpdate}
                  />
                </div>
                <div>
                  <Label htmlFor="rate_limit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    value={settingsForm.rate_limit}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, rate_limit: parseInt(e.target.value) }))}
                    disabled={!canUpdate}
                  />
                </div>
                <PermissionGuard permission="subaccounts:update">
                  <Button onClick={updateSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </PermissionGuard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage API keys for this subaccount
                    </CardDescription>
                  </div>
                  <PermissionGuard permission="subaccounts:update">
                    <Dialog open={newApiKeyDialog} onOpenChange={setNewApiKeyDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create API Key
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Create a new API key for this subaccount
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="key_name">Name</Label>
                            <Input
                              id="key_name"
                              value={newApiKeyForm.name}
                              onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Production API Key"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setNewApiKeyDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createApiKey} disabled={saving || !newApiKeyForm.name}>
                            {saving ? 'Creating...' : 'Create Key'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No API keys created yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((apiKey) => {
                        const isBeingDeleted = deleting && deleteApiKeyId === apiKey.id
                        return (
                          <TableRow 
                            key={apiKey.id}
                            className={isBeingDeleted ? "opacity-50" : ""}
                          >
                            <TableCell>{apiKey.name}</TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {apiKey.key_preview}
                              </code>
                            </TableCell>
                            <TableCell>
                              {new Date(apiKey.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {apiKey.last_used 
                                ? new Date(apiKey.last_used).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              <PermissionGuard permission="subaccounts:update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isBeingDeleted}
                                  onClick={() => {
                                    setDeleteApiKeyId(apiKey.id)
                                    setDeleteApiKeyName(apiKey.name)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Usage</CardTitle>
              <CardDescription>
                Monitor usage and manage billing for this subaccount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Billing features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Subaccount Members</CardTitle>
              <CardDescription>
                Manage who has access to this subaccount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Member management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting a subaccount is permanent and cannot be undone. All data associated with this subaccount will be lost.
                  </AlertDescription>
                </Alert>
                <PermissionGuard permission="subaccounts:delete">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Subaccount
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Subaccount</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{subaccount.name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={deleteSubaccount}>
                          Delete Subaccount
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Key Display Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={closeApiKeyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your API key has been created. Copy it now as it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This is the only time you'll see this key. Make sure to copy and store it securely.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdApiKey || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyApiKey}
                  className="shrink-0"
                >
                  {apiKeyCopied ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeApiKeyDialog}>
              I've copied the key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the API key "{deleteApiKeyName}"? This action cannot be undone and will immediately revoke access for any applications using this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteApiKeyId(null)
                setDeleteApiKeyName('')
              }}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={deleteApiKey}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete API Key'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}