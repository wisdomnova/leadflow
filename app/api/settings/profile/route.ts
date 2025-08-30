// ./app/api/settings/profile/route.ts - Update user profile using Supabase

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

    const { name, company, timezone, language } = await request.json()

    // Split name into first and last name
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        company_name: company,
        timezone: timezone,
        language: language
      })
      .eq('id', user.id)
      .select('first_name, last_name, company_name, timezone, language')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
      company: updatedUser.company_name,
      timezone: updatedUser.timezone,
      language: updatedUser.language
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}