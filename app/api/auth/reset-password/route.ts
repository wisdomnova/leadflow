import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Find user by reset token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if token has expired
    if (!user.password_reset_expires_at || new Date() > new Date(user.password_reset_expires_at)) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          organization_id: user.organization_id,
          user_id: user.id,
          action: 'password_reset_completed',
          description: 'Password successfully reset'
        }])
    } catch (logError) {
      console.warn('Failed to log password reset activity:', logError)
    }

    return NextResponse.json({ message: 'Password reset successfully' })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}