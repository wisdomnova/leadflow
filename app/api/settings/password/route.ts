// ./app/api/settings/password/route.ts - Change password using Supabase

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

    const { currentPassword, newPassword } = await request.json()

    // First, verify the current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}