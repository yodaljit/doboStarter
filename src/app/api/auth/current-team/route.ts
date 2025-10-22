import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { teamId } = await request.json()
    
    if (!teamId || typeof teamId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set('currentTeamId', teamId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set current team error:', error)
    return NextResponse.json(
      { error: 'Failed to set current team' },
      { status: 500 }
    )
  }
}