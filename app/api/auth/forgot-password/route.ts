// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/resend'
import { passwordResetTemplate } from '@/lib/email-templates'
import crypto from 'crypto'

export async function POST(request: NextRequest) { 
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email 
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    // Always return success for security (don't reveal if email exists)
    if (userError || !user) {
      return NextResponse.json({ 
        message: 'If an account with this email exists, you will receive a password reset link.' 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_reset_token: resetToken,
        password_reset_expires_at: resetExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to save reset token:', updateError)
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email via Resend
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your LeadFlow Password',
        html: passwordResetTemplate({
          name: user.first_name || 'there',
          resetUrl
        })
      })
    } catch (emailError) {
      console.error('Failed to send reset email via Resend:', emailError)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          organization_id: user.organization_id,
          user_id: user.id,
          action: 'password_reset_requested',
          description: 'Password reset email sent'
        }])
    } catch (logError) {
      console.warn('Failed to log password reset activity:', logError)
    }

    return NextResponse.json({ 
      message: 'If an account with this email exists, you will receive a password reset link.' 
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}