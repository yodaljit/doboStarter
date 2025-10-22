'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Mail, Clock, Lock } from 'lucide-react'

interface InvitationData {
  email: string
  role: string
  team: {
    name: string
    description?: string
  }
  expires_at: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')

  const token = params.token as string

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}/accept`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load invitation')
        return
      }

      setInvitation(data.invitation)
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              You have successfully joined {invitation?.team.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Team:</span>
                  <span>{invitation.team.name}</span>
                </div>
                {invitation.team.description && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {invitation.team.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email:</span>
                  <span>{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">{invitation.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                </div>
              </div>

              {!success && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Set your password</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={accepting}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success ? (
                <Alert>
                  <AlertDescription>
                    Account created and invitation accepted successfully! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={acceptInvitation}
                  disabled={accepting || !password.trim()}
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Accept Invitation & Create Account'
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}