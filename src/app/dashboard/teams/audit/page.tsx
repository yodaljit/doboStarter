'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Activity, 
  Search, 
  Filter,
  Calendar,
  User,
  Building2,
  Settings,
  Mail,
  CreditCard,
  Shield
} from 'lucide-react'
import { PermissionGuard } from '@/lib/rbac/components'

interface AuditLog {
  id: string
  action: string
  resource_type: string
  resource_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  created_at: string
  profiles: {
    email: string
    full_name: string | null
  } | null
}

export default function AuditLogsPage() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/teams/current/audit-logs')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Settings className="h-4 w-4 text-green-600" />
    if (action.includes('update')) return <Settings className="h-4 w-4 text-blue-600" />
    if (action.includes('delete')) return <Settings className="h-4 w-4 text-red-600" />
    if (action.includes('invite')) return <Mail className="h-4 w-4 text-purple-600" />
    if (action.includes('login')) return <Shield className="h-4 w-4 text-gray-600" />
    if (action.includes('payment')) return <CreditCard className="h-4 w-4 text-orange-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800'
    if (action.includes('update')) return 'bg-blue-100 text-blue-800'
    if (action.includes('delete')) return 'bg-red-100 text-red-800'
    if (action.includes('invite')) return 'bg-purple-100 text-purple-800'
    if (action.includes('login')) return 'bg-gray-100 text-gray-800'
    if (action.includes('payment')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'team':
        return <Building2 className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'subaccount':
        return <Settings className="h-4 w-4" />
      case 'invitation':
        return <Mail className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter)
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter

    return matchesSearch && matchesAction && matchesResource
  })

  const uniqueActions = [...new Set(auditLogs.map(log => log.action.split('_')[0]))]
  const uniqueResources = [...new Set(auditLogs.map(log => log.resource_type))]

  return (
    <DashboardLayout>
      <PermissionGuard permission="team:read">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-2 text-gray-600">
              Track all activities and changes in your team
            </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {uniqueActions.map(action => (
                        <SelectItem key={action} value={action}>
                          {formatAction(action)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Resource</label>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All resources</SelectItem>
                      {uniqueResources.map(resource => (
                        <SelectItem key={resource} value={resource}>
                          {formatAction(resource)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Activity Log</span>
              </CardTitle>
              <CardDescription>
                Recent activities and changes in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No audit logs found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <Badge className={getActionColor(log.action)}>
                              {formatAction(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(log.resource_type)}
                            <span className="capitalize">{log.resource_type}</span>
                            {log.resource_id && (
                              <span className="text-sm text-gray-500">
                                ({log.resource_id.slice(0, 8)}...)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.profiles?.full_name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.profiles?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {log.ip_address || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </DashboardLayout>
  )
}