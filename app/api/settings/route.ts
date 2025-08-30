// ./app/api/settings/route.ts - Get user settings using Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        first_name,
        last_name,
        email,
        company_name,
        timezone,
        language,
        email_notifications,
        push_notifications,
        marketing_emails,
        security_alerts,
        theme
      `)
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Format the response to match the frontend interface
    const settings = {
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      email: userData.email,
      company: userData.company_name || '',
      timezone: userData.timezone || 'UTC',
      language: userData.language || 'en',
      emailNotifications: userData.email_notifications ?? true,
      pushNotifications: userData.push_notifications ?? true,
      marketingEmails: userData.marketing_emails ?? false,
      securityAlerts: userData.security_alerts ?? true,
      theme: userData.theme || 'light'
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}