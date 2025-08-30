// ./app/api/settings/notifications/route.ts - Update notification preferences using Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      emailNotifications, 
      pushNotifications, 
      marketingEmails, 
      securityAlerts 
    } = await request.json()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        marketing_emails: marketingEmails,
        security_alerts: securityAlerts
      })
      .eq('id', user.id)
      .select('email_notifications, push_notifications, marketing_emails, security_alerts')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({
      emailNotifications: updatedUser.email_notifications,
      pushNotifications: updatedUser.push_notifications,
      marketingEmails: updatedUser.marketing_emails,
      securityAlerts: updatedUser.security_alerts
    })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}