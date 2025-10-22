import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'admin@example.com',
  'superadmin@example.com'
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Mock data for email templates
    const templates = [
      {
        id: '1',
        name: 'Welcome Newsletter',
        subject: 'Welcome to our platform!',
        content: '<h1>Welcome!</h1><p>Thank you for joining our platform. We\'re excited to have you on board.</p>',
        type: 'welcome',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Monthly Newsletter',
        subject: 'Your monthly update is here!',
        content: '<h1>Monthly Update</h1><p>Here\'s what\'s new this month...</p>',
        type: 'newsletter',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Special Promotion',
        subject: '50% Off - Limited Time Offer!',
        content: '<h1>Special Offer</h1><p>Get 50% off your next subscription upgrade!</p>',
        type: 'promotion',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, subject, content, type } = await request.json()

    if (!name || !subject || !content || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In a real implementation, this would save to database
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      content,
      type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}