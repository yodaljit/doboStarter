'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useTheme } from '@/lib/theme/provider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Trash2,
  Save,
  Building2,
  Users,
  Key,
  Mail,
  Globe,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Crown
} from 'lucide-react'

export default function SettingsPage() {
  const { user, currentTeam, userRole, refreshTeams } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [teamLoading, setTeamLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Form states
  const [teamName, setTeamName] = useState(currentTeam?.name || '')
  const [teamSlug, setTeamSlug] = useState(currentTeam?.slug || '')
  const [teamDescription, setTeamDescription] = useState(currentTeam?.description || '')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [timezone, setTimezone] = useState('UTC')
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Load user profile settings
  useEffect(() => {
    const loadProfileSettings = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const { profile } = await response.json()
          setTimezone(profile.timezone || 'UTC')
          setEmailNotifications(profile.email_notifications ?? true)
          setPushNotifications(profile.push_notifications ?? true)
          setMarketingEmails(profile.marketing_emails ?? false)
        }
      } catch (error) {
        console.error('Failed to load profile settings:', error)
      }
    }

    loadProfileSettings()
  }, [user])

  // Update team form when currentTeam changes
  useEffect(() => {
    if (currentTeam) {
      setTeamName(currentTeam.name || '')
      setTeamSlug(currentTeam.slug || '')
      setTeamDescription(currentTeam.description || '')
    }
  }, [currentTeam])

  const handleSaveProfileSettings = async () => {
    setProfileLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timezone,
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          marketing_emails: marketingEmails,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save profile settings:', error)
      alert('Failed to save profile settings. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSaveTeamSettings = async () => {
    if (!currentTeam) return
    
    setTeamLoading(true)
    try {
      const response = await fetch('/api/teams', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: currentTeam.id,
          name: teamName,
          slug: teamSlug,
          description: teamDescription,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update team settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      // Refresh teams to get updated data
      refreshTeams()
    } catch (error) {
      console.error('Failed to save team settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save team settings. Please try again.')
    } finally {
      setTeamLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!currentTeam) return
    
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/teams?teamId=${currentTeam.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete team')
      }

      // Redirect to teams page after successful deletion
      router.push('/dashboard/teams')
    } catch (error) {
      console.error('Failed to delete team:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete team. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const isOwner = userRole === 'owner'
  const isAdmin = userRole === 'admin' || userRole === 'owner'

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and team preferences
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {saved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Settings saved</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              <a
                href="#account"
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary"
              >
                <User className="h-4 w-4" />
                <span>Account</span>
              </a>
              {isAdmin && (
                <a
                  href="#team"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Team</span>
                </a>
              )}
              <a
                href="#notifications"
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </a>
              <a
                href="#appearance"
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted"
              >
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </a>
              <a
                href="#security"
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted"
              >
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </a>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Settings */}
            <Card className="border-0 shadow-sm" id="account">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your personal account information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfileSettings} 
                    disabled={profileLoading}
                    className="min-w-[120px]"
                  >
                    {profileLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Settings */}
            {isAdmin && (
              <Card className="border-0 shadow-sm" id="team">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Team Settings</CardTitle>
                      <CardDescription>
                        Configure your team information and preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={teamName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
                        placeholder="Enter team name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamSlug">Team Slug</Label>
                      <Input
                        id="teamSlug"
                        value={teamSlug}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamSlug(e.target.value)}
                        placeholder="team-slug"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in URLs and API endpoints
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamDescription">Team Description</Label>
                    <Textarea
                      id="teamDescription"
                      value={teamDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTeamDescription(e.target.value)}
                      placeholder="Describe your team's purpose and goals"
                      rows={3}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Current Plan</h4>
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <Badge variant="secondary">
                          {currentTeam?.subscription_status || 'Free'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="/dashboard/billing">Manage Billing</a>
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveTeamSettings} 
                      disabled={teamLoading}
                      className="min-w-[120px]"
                    >
                      {teamLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            <Card className="border-0 shadow-sm" id="notifications">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to be notified
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfileSettings} 
                    disabled={profileLoading}
                    className="min-w-[120px]"
                  >
                    {profileLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card className="border-0 shadow-sm" id="appearance">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex items-center space-x-2"
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex items-center space-x-2"
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex items-center space-x-2"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-0 shadow-sm" id="security">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Manage your account security and privacy
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {passwordSuccess && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">{passwordSuccess}</span>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep your account secure with a strong password
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  {showPasswordForm && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      {passwordError && (
                        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{passwordError}</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleChangePassword}
                          disabled={passwordLoading}
                          className="min-w-[120px]"
                        >
                          {passwordLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Updating...</span>
                            </div>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                            setPasswordError('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {isOwner && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      <CardDescription>
                        Irreversible and destructive actions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-destructive">Delete Team</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this team and all associated data
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleteLoading}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteLoading ? 'Deleting...' : 'Delete Team'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the team
                            "{currentTeam?.name}" and remove all associated data including members,
                            projects, and billing information.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTeam}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? 'Deleting...' : 'Delete Team'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}