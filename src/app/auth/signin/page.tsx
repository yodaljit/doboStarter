import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Mail, Lock, Chrome } from 'lucide-react'
import { login } from '@/app/auth/actions'

interface SignInProps {
  searchParams: Promise<{
    error?: string
    message?: string
  }>
}

export default async function SignIn({ searchParams }: SignInProps) {
  const { error, message } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">Sign in</CardTitle>
            <CardDescription className="text-center text-sm">
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {error === 'missing-fields' 
                    ? 'Please fill in all fields' 
                    : decodeURIComponent(error)
                  }
                </span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {message === 'check-email' 
                    ? 'Check your email for the confirmation link' 
                    : decodeURIComponent(message)
                  }
                </span>
              </div>
            )}

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  Sign in with email
                </span>
              </div>
            </div>
            
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11">
                Sign in
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}