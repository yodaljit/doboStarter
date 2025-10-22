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

    // Mock data for email campaigns
    const campaigns = [
      {
        id: '1',
        name: 'Welcome Series Campaign',
        template_id: '1',
        template_name: 'Welcome Newsletter',
        status: 'sent',
        recipients_count: 1250,
        sent_count: 1250,
        open_rate: 24.5,
        click_rate: 3.2,
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Monthly Newsletter - December',
        template_id: '2',
        template_name: 'Monthly Newsletter',
        status: 'scheduled',
        recipients_count: 3420,
        sent_count: 0,
        open_rate: 0,
        click_rate: 0,
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Holiday Promotion',
        template_id: '3',
        template_name: 'Special Promotion',
        status: 'draft',
        recipients_count: 2800,
        sent_count: 0,
        open_rate: 0,
        click_rate: 0,
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
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

    const { name, template_id, scheduled_at } = await request.json()

    if (!name || !template_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In a real implementation, this would save to database
    const newCampaign = {
      id: Date.now().toString(),
      name,
      template_id,
      template_name: 'Template Name', // Would be fetched from template
      status: scheduled_at ? 'scheduled' : 'draft',
      recipients_count: Math.floor(Math.random() * 5000) + 1000, // Mock data
      sent_count: 0,
      open_rate: 0,
      click_rate: 0,
      scheduled_at: scheduled_at || undefined,
      created_at: new Date().toISOString()
    }

    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}