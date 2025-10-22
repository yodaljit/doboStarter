'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Lock,
  Palette,
  Rocket,
  Settings,
  Users,
  Zap,
  Star,
  Github,
  Twitter,
} from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  
  const features = [
    {
      icon: Lock,
      title: "Authentication & Security",
      description: "Secure user authentication with email/password, social logins, and session management powered by Supabase."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Multi-tenant architecture with team creation, member invitations, and role-based access control."
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Integrated Stripe billing with subscription management, invoicing, and payment processing."
    },
    {
      icon: Palette,
      title: "Modern UI Components",
      description: "Beautiful, accessible interface built with shadcn/ui and Tailwind CSS for rapid development."
    },
    {
      icon: Rocket,
      title: "Production Ready",
      description: "Optimized for performance with TypeScript, Next.js 14, and production-grade architecture."
    },
    {
      icon: Settings,
      title: "Developer Experience",
      description: "Complete development setup with hot reload, testing, and deployment configurations."
    }
  ];
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">SaaS Foundation</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-1">
            <Zap className="mr-2 h-3 w-3" />
            Production Ready SaaS Foundation
          </Badge>
          
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Build Your SaaS
              <span className="text-primary block">10x Faster</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Complete SaaS foundation with authentication, team management, billing, and more. 
              Focus on your product, not the infrastructure.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="min-w-[200px]">
                Start Building Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Button>
          </div>

          <div className="flex items-center space-x-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 rating</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span>1000+ developers</span>
            <Separator orientation="vertical" className="h-4" />
            <span>MIT License</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to build</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete SaaS foundation with authentication, payments, and team management built-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of developers building amazing SaaS applications with our foundation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Building Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">SaaS Foundation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete foundation for building modern SaaS applications.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Features</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Pricing</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Documentation</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">About</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Blog</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Contact</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Privacy</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Terms</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Security</Link>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 SaaS Foundation. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
