// ./app/api/settings/delete-account/route.ts - Delete user account using Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
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

    // Delete user data in the correct order (due to foreign key constraints)
    
    // 1. Delete campaigns
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .eq('user_id', user.id)

    if (campaignsError) {
      console.error('Error deleting campaigns:', campaignsError)
    }

    // 2. Delete contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', user.id)

    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
    }

    // 3. Delete user record
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (userError) {
      console.error('Error deleting user:', userError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // 4. Delete auth user (this will also sign them out)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      // Continue anyway as the user data is already deleted
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}