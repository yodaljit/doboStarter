'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'newsletter' | 'promotion' | 'announcement' | 'welcome'
  created_at: string
  updated_at: string
}

interface EmailCampaign {
  id: string
  name: string
  template_id: string
  template_name: string
  status: 'draft' | 'scheduled' | 'sent' | 'sending'
  recipients_count: number
  sent_count: number
  open_rate: number
  click_rate: number
  scheduled_at?: string
  sent_at?: string
  created_at: string
}

export default function MarketingPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)

  const [templateForm, setTemplateForm] = useState<{
    name: string
    subject: string
    content: string
    type: 'newsletter' | 'promotion' | 'announcement' | 'welcome'
  }>({
    name: '',
    subject: '',
    content: '',
    type: 'newsletter'
  })

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template_id: '',
    scheduled_at: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, campaignsRes] = await Promise.all([
        fetch('/api/admin/marketing/templates'),
        fetch('/api/admin/marketing/campaigns')
      ])

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData)
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate 
        ? `/api/admin/marketing/templates/${editingTemplate.id}`
        : '/api/admin/marketing/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      })

      if (response.ok) {
        fetchData()
        setShowTemplateDialog(false)
        setEditingTemplate(null)
        setTemplateForm({ name: '', subject: '', content: '', type: 'newsletter' })
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleSaveCampaign = async () => {
    try {
      const url = editingCampaign 
        ? `/api/admin/marketing/campaigns/${editingCampaign.id}`
        : '/api/admin/marketing/campaigns'
      
      const method = editingCampaign ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      })

      if (response.ok) {
        fetchData()
        setShowCampaignDialog(false)
        setEditingCampaign(null)
        setCampaignForm({ name: '', template_id: '', scheduled_at: '' })
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/marketing/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleSendCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/marketing/campaigns/${id}/send`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'sending': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter': return 'bg-blue-100 text-blue-800'
      case 'promotion': return 'bg-green-100 text-green-800'
      case 'announcement': return 'bg-purple-100 text-purple-800'
      case 'welcome': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Center</h1>
          <p className="text-muted-foreground">
            Manage email templates and marketing campaigns
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'sent' || c.status === 'sending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.recipients_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 
                ? `${(campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length).toFixed(1)}%`
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Create and manage reusable email templates</CardDescription>
            </div>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null)
                  setTemplateForm({ name: '', subject: '', content: '', type: 'newsletter' })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Type</Label>
                    <Select 
                      value={templateForm.type} 
                      onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="template-subject">Subject Line</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="Enter email subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-content">Email Content</Label>
                    <Textarea
                      id="template-content"
                      value={templateForm.content}
                      onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                      placeholder="Enter email content (HTML supported)"
                      rows={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template)
                      setTemplateForm({
                        name: template.name,
                        subject: template.subject,
                        content: template.content,
                        type: template.type
                      })
                      setShowTemplateDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Create and manage email marketing campaigns</CardDescription>
            </div>
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCampaign(null)
                  setCampaignForm({ name: '', template_id: '', scheduled_at: '' })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-template">Email Template</Label>
                    <Select 
                      value={campaignForm.template_id} 
                      onValueChange={(value) => setCampaignForm({ ...campaignForm, template_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="campaign-scheduled">Schedule (Optional)</Label>
                    <Input
                      id="campaign-scheduled"
                      type="datetime-local"
                      value={campaignForm.scheduled_at}
                      onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_at: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCampaign}>
                    {editingCampaign ? 'Update' : 'Create'} Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Template: {campaign.template_name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{campaign.recipients_count.toLocaleString()} recipients</span>
                    {campaign.status === 'sent' && (
                      <>
                        <span>•</span>
                        <span>{campaign.open_rate}% open rate</span>
                        <span>•</span>
                        <span>{campaign.click_rate}% click rate</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendCampaign(campaign.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}